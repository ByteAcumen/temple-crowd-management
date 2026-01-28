const redis = require('../config/redis');
const axios = require('axios');

// Constants
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-service:8000';

// @desc    Process User Query
// @route   POST /api/v1/bot/query
// @access  Public (or Protected, depending on plan)
exports.chat = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: 'Query is required' });

        const lowerQuery = query.toLowerCase();
        let answer = "";
        let source = "static";

        // --- HYBRID INTELLIGENCE LOGIC ---

        // 1. Future Prediction (Keep explicit logic for now to fetch forecast)
        if (lowerQuery.includes('tomorrow') || lowerQuery.includes('predict') || lowerQuery.includes('future')) {
            const tomorrow = getTomorrowDate();
            const aiData = await getAIPrediction(tomorrow);
            answer = `For tomorrow (${tomorrow}), our AI Brain predicts about ${aiData.visitors} visitors. Status: ${aiData.status}.`;
            source = "ai_forecasting_engine";
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
                source = "semantic_rag_model";
            } catch (err) {
                console.error("RAG Error:", err.message);
                answer = "My Brain is currently offline 🧠. But I can tell you: " + liveContext;
                source = "fallback_live";
            }
        }

        res.status(200).json({
            success: true,
            answer,
            source
        });

    } catch (error) {
        console.error("Bot Error:", error);
        res.status(500).json({ success: false, answer: "I'm having trouble thinking right now.", error: error.message });
    }
};

// Helper: Get Live Data
async function getLiveCrowd() {
    const countStr = await redis.get('temple_crowd_count');
    const count = parseInt(countStr) || 0;
    let status = 'Relaxed 🟢';
    if (count > 15000) status = 'CRITICAL 🔴';
    else if (count > 10000) status = 'Busy 🟠';

    return { count, status };
}

// Helper: Get AI Prediction
async function getAIPrediction(dateStr) {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/predict`, {
            temple_name: "Somnath", // Default
            date_str: dateStr,
            temperature: 30, // Default avg
            rain_flag: 0,
            moon_phase: "Normal",
            is_weekend: 0
        });
        return {
            visitors: response.data.predicted_visitors,
            status: response.data.crowd_status
        };
    } catch (e) {
        return { visitors: "Unknown", status: "Offline" };
    }
}

function getTomorrowDate() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
}
