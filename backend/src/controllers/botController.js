const axios = require('axios');
const Temple = require('../models/Temple');
const crowdTracker = require('../services/CrowdTracker');

// Constants
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || process.env.ML_FORECASTING_URL || 'http://localhost:8002';

// @desc    Process User Query
// @route   POST /api/v1/bot/query
// @access  Public (or Protected, depending on plan)
exports.chat = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: 'Query is required' });

        const lowerQuery = query.toLowerCase();
        let answer = '';
        let source = 'static';

        // --- HYBRID INTELLIGENCE LOGIC ---

        // 1. Future Prediction (Keep explicit logic for now to fetch forecast)
        if (lowerQuery.includes('tomorrow') || lowerQuery.includes('predict') || lowerQuery.includes('future')) {
            const tomorrow = getTomorrowDate();
            const aiData = await getAIPrediction(tomorrow);
            answer = `For tomorrow (${tomorrow}), our AI Brain predicts about ${aiData.visitors} visitors. Status: ${aiData.status}.`;
            source = 'ai_forecasting_engine';
        }
        // 2. Everything else -> SEMANTIC RAG (Python)
        else {
            // Fetch Context (Live Crowd)
            const crowdData = await getLiveCrowd();
            const liveContext = `Current Devotee Count: ${crowdData.count}. Safety Status: ${crowdData.status}.`;

            // Call Python RAG
            try {
                const ragResponse = await axios.post(`${AI_SERVICE_URL}/chat`, {
                    query: query,
                    context: liveContext
                });
                answer = ragResponse.data.answer;
                source = 'semantic_rag_model';
            } catch (err) {
                console.error('RAG Error:', err.message);
                answer = 'My Brain is currently offline 🧠. But I can tell you: ' + liveContext;
                source = 'fallback_live';
            }
        }

        res.status(200).json({
            success: true,
            answer,
            source
        });

    } catch (error) {
        console.error('Bot Error:', error);
        res.status(500).json({ success: false, answer: 'I\'m having trouble thinking right now.', error: error.message });
    }
};

// Helper: Get Live Data (aggregate from all temples via CrowdTracker)
async function getLiveCrowd() {
    try {
        const temples = await Temple.find({ status: 'OPEN' }).select('_id capacity');
        let totalCount = 0;
        let totalCapacity = 0;
        for (const temple of temples) {
            const count = await crowdTracker.getCurrentCount(temple._id.toString());
            totalCount += count;
            totalCapacity += temple.capacity?.total || 0;
        }
        const percentage = totalCapacity > 0 ? (totalCount / totalCapacity) * 100 : 0;
        let status = 'Relaxed 🟢';
        if (percentage >= 95) status = 'CRITICAL 🔴';
        else if (percentage >= 85) status = 'Busy 🟠';
        return { count: totalCount, status };
    } catch {
        return { count: 0, status: 'Relaxed 🟢' };
    }
}

// Helper: Get AI Prediction
async function getAIPrediction(dateStr) {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/predict`, {
            temple_name: 'Somnath', // Default
            date_str: dateStr,
            temperature: 30, // Default avg
            rain_flag: 0,
            moon_phase: 'Normal',
            is_weekend: 0
        });
        return {
            visitors: response.data.predicted_visitors,
            status: response.data.crowd_status
        };
    } catch (e) {
        return { visitors: 'Unknown', status: 'Offline' };
    }
}

function getTomorrowDate() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
}
