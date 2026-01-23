const redis = require('../config/redis');

// Constants for Crowd Safety
const MAX_CAPACITY = 20000; // Can be env var
const WARNING_THRESHOLD = 0.7 * MAX_CAPACITY; // 70%
const CRITICAL_THRESHOLD = 0.9 * MAX_CAPACITY; // 90%

// @desc    Record an Entry (Digital or Walk-in)
// @route   POST /api/v1/live/entry
// @access  Private (Gatekeeper/Admin)
exports.recordEntry = async (req, res) => {
    try {
        const count = await redis.incr('temple_crowd_count');

        let status = 'Safe';
        if (count > CRITICAL_THRESHOLD) status = 'CRITICAL';
        else if (count > WARNING_THRESHOLD) status = 'WARNING';

        res.status(200).json({
            success: true,
            action: 'ENTRY',
            current_count: count,
            status: status
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Record an Exit
// @route   POST /api/v1/live/exit
// @access  Private (Gatekeeper/Admin)
exports.recordExit = async (req, res) => {
    try {
        let count = await redis.get('temple_crowd_count');
        count = parseInt(count) || 0;

        if (count > 0) {
            count = await redis.decr('temple_crowd_count');
        }

        res.status(200).json({
            success: true,
            action: 'EXIT',
            current_count: count
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get Live Safety Status (For Dashboard)
// @route   GET /api/v1/live/status
// @access  Private (Admin/Gatekeeper)
exports.getLiveStatus = async (req, res) => {
    try {
        const countStr = await redis.get('temple_crowd_count');
        const count = parseInt(countStr) || 0;

        let status = 'GREEN'; // Safe
        if (count > CRITICAL_THRESHOLD) status = 'RED'; // Danger
        else if (count > WARNING_THRESHOLD) status = 'ORANGE'; // Warning

        res.status(200).json({
            success: true,
            current_count: count,
            max_capacity: MAX_CAPACITY,
            occupancy_percentage: ((count / MAX_CAPACITY) * 100).toFixed(1) + '%',
            safety_status: status
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
