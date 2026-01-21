const Booking = require('../models/Booking');
const axios = require('axios');

// @desc    Create a new booking (with AI Capacity Check)
// @route   POST /api/v1/bookings
// @access  Public
exports.createBooking = async (req, res) => {
    try {
        const { templeName, date, slot, visitors, userEmail, temperature, rain_flag } = req.body;

        // --- 1. AI PREDICTION CHECK ---
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://ai-service:8000';
        let crowdStatus = 'Normal';
        let predictedFootfall = 0;

        try {
            // Calculate Weekend for AI
            const dt = new Date(date);
            const isWeekend = (dt.getDay() === 0 || dt.getDay() === 6) ? 1 : 0;

            console.log(`🤖 Consulting AI Brain for ${templeName} on ${date}...`);

            const aiResponse = await axios.post(`${aiServiceUrl}/predict`, {
                temple_name: templeName,
                date_str: date,
                temperature: temperature || 30, // Default or fetch real weather
                rain_flag: rain_flag || 0,
                moon_phase: "Normal", // Future: Fetch astronomy API
                is_weekend: isWeekend
            });

            crowdStatus = aiResponse.data.crowd_status;
            predictedFootfall = aiResponse.data.predicted_visitors;

            console.log(`🧠 AI Verdict: ${crowdStatus} (${predictedFootfall} visitors)`);

        } catch (error) {
            console.error("⚠️ AI Service Unavailable:", error.message);
            // Decisions: Fail open or closed? For MVP, we Log & Proceed.
        }

        // --- 2. CAPACITY GUARD ---
        if (crowdStatus === 'CRITICAL') {
            return res.status(400).json({
                success: false,
                message: 'Booking Failed: Temple is at CRITICAL capacity for this date.',
                reason: 'AI Crowd Guard Blocked Request',
                prediction: predictedFootfall
            });
        }

        // --- 3. CREATE BOOKING ---
        const newBooking = await Booking.create({
            templeName,
            date,
            slot,
            visitors,
            userEmail
        });

        res.status(201).json({
            success: true,
            data: newBooking,
            ai_insight: {
                status: crowdStatus,
                predicted_footfall: predictedFootfall
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get user bookings
// @route   GET /api/v1/bookings
// @access  Public
exports.getMyBookings = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: 'Email query param required' });

        const bookings = await Booking.find({ userEmail: email }).sort({ date: -1 });

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
