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

        // --- INTELLIGENCE LOGIC ---

        // 1. Live Crowd Status
        if (lowerQuery.includes('crowd') || lowerQuery.includes('rush') || lowerQuery.includes('status') || lowerQuery.includes('people')) {
            const crowdData = await getLiveCrowd();
            answer = `Currently, there are ${crowdData.count} devotees in the temple. The status is ${crowdData.status}.`;
            source = "live_redis";
        }

        // 2. Future Prediction (Uses ML Model)
        else if (lowerQuery.includes('tomorrow') || lowerQuery.includes('predict') || lowerQuery.includes('forecast')) {
            // Simplified: "tomorrow" logic. In a real bot, we'd extract the date.
            const tomorrow = getTomorrowDate();
            const aiData = await getAIPrediction(tomorrow);
            answer = `For tomorrow (${tomorrow}), our AI Brain predicts about ${aiData.visitors} visitors. Status: ${aiData.status}.`;
            source = "ai_model";
        }

        // 3. Static Info
        else if (lowerQuery.includes('time') || lowerQuery.includes('open')) {
            answer = "The temple is open every day from 6:00 AM to 9:00 PM. Aarti is at 7:00 AM and 7:00 PM.";
        }

        // 4. Fallback
        else {
            answer = "I am the TempleBot. Ask me about 'Current Crowd', 'Tomorrow's Prediction', or 'Timings'.";
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
