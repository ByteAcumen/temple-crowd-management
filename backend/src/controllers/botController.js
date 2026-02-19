const axios = require('axios');
const Temple = require('../models/Temple');
const crowdTracker = require('../services/CrowdTracker');
const BotMemory = require('../services/BotMemory');
const { v4: uuidv4 } = require('uuid');

// Constants
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || process.env.ML_FORECASTING_URL || 'http://localhost:8002';

// --- AGENT TOOLS ---
const tools = {
    async getTempleStatus(name) {
        const temple = await Temple.findOne({ name: { $regex: name, $options: 'i' } });
        if (!temple) return `I couldn't find a temple named "${name}".`;
        const count = await crowdTracker.getCurrentCount(temple._id.toString());
        return `Current status for ${temple.name}: ${count} visitors. Status: ${temple.status}. Capacity: ${temple.capacity.total}.`;
    },
    async closeTemple(name) {
        // In a real agent, we'd check permissions here.
        const temple = await Temple.findOneAndUpdate(
            { name: { $regex: name, $options: 'i' } },
            { status: 'CLOSED' },
            { new: true }
        );
        if (!temple) return `I couldn't find "${name}".`;
        return `✅ ACTION EXECUTED: ${temple.name} is now CLOSED.`;
    },
    async openTemple(name) {
        const temple = await Temple.findOneAndUpdate(
            { name: { $regex: name, $options: 'i' } },
            { status: 'OPEN' },
            { new: true }
        );
        if (!temple) return `I couldn't find "${name}".`;
        return `✅ ACTION EXECUTED: ${temple.name} is now OPEN.`;
    }
};

// @desc    Smart Agent Chat
// @route   POST /api/v1/bot/query
exports.chat = async (req, res) => {
    try {
        const { query, sessionId } = req.body;

        // 1. Session Management
        // If no sessionId provided, generate new one
        const activeSessionId = sessionId || uuidv4();

        if (!query) return res.status(400).json({ error: 'Query is required' });

        // 2. Add User Message to History
        BotMemory.addMessage(activeSessionId, 'user', query);

        const lowerQuery = query.toLowerCase();
        let answer = '';
        let source = 'agent_logic';

        // 3. INTENT CLASSIFICATION (Simple logic for now)
        // Check for specific commands
        if (lowerQuery.includes('close') && lowerQuery.includes('temple')) {
            // Extract temple name (naive)
            // "Close Somnath temple" -> "Somnath"
            const words = lowerQuery.split(' ');
            const templeIndex = words.indexOf('close') + 1;
            const templeName = words[templeIndex]; // Simple extraction
            answer = await tools.closeTemple(templeName || 'Somnath'); // Default for demo
        }
        else if (lowerQuery.includes('open') && lowerQuery.includes('temple')) {
            const words = lowerQuery.split(' ');
            const templeIndex = words.indexOf('open') + 1;
            const templeName = words[templeIndex];
            answer = await tools.openTemple(templeName || 'Somnath');
        }
        else if (lowerQuery.includes('status') || lowerQuery.includes('how many')) {
            // "Status of Somnath"
            const templeName = 'Somnath'; // Hardcoded for simplified MVP logic
            answer = await tools.getTempleStatus(templeName);
        }
        // 4. Fallback to RAG / AI
        else {
            // Get History
            const history = BotMemory.getHistoryContext(activeSessionId);

            // Get Live Context
            const liveStats = await getLiveCrowd();
            const systemContext = `
                You are a Temple Admin Assistant.
                Current Global Crowd: ${liveStats.count}.
                Safety Level: ${liveStats.status}.
                Conversation History:
                ${history}
             `;

            try {
                // Call RAG Service (Mock or Python)
                const ragResponse = await axios.post(`${AI_SERVICE_URL}/chat`, {
                    query: query,
                    context: systemContext
                });
                answer = ragResponse.data.answer;
                source = 'ai_rag';
            } catch (e) {
                answer = "I'm having trouble connecting to my brain, but I'm here to help!";
            }
        }

        // 5. Add Assistant Message to History
        BotMemory.addMessage(activeSessionId, 'assistant', answer);

        res.status(200).json({
            success: true,
            sessionId: activeSessionId,
            answer,
            source
        });

    } catch (error) {
        console.error('Agent Error:', error);
        res.status(500).json({ success: false, error: 'Agent Malfunction' });
    }
};

// Helper: Live Global Stats
async function getLiveCrowd() {
    try {
        const temples = await Temple.find({ status: 'OPEN' }).select('_id capacity');
        let totalCount = 0;
        for (const temple of temples) {
            totalCount += await crowdTracker.getCurrentCount(temple._id.toString());
        }
        return { count: totalCount, status: totalCount > 5000 ? 'BUSY' : 'NORMAL' };
    } catch {
        return { count: 0, status: 'UNKNOWN' };
    }
}
