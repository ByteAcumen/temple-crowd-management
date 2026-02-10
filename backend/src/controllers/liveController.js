const crowdTracker = require('../services/CrowdTracker');
const Booking = require('../models/Booking');
const Temple = require('../models/Temple');

/**
 * Live Crowd Monitoring Controller
 * 
 * GATEKEEPER OPERATIONS:
 * - Entry: Scan QR → Verify booking → Record entry → Update Redis
 * - Exit: Scan QR → Verify person inside → Record exit → Update Redis
 * 
 * DASHBOARD OPERATIONS:
 * - Get live crowd data for specific temple
 * - Real-time traffic light status (GREEN/ORANGE/RED)
 */

// @desc    Get All Temples Live Status (Dashboard Overview)
// @route   GET /api/v1/live
// @access  Public
// Returns ALL temples (OPEN + CLOSED) so dashboard always shows data; status indicates if open
exports.getAllLiveData = async (req, res) => {
    try {
        // Get ALL temples (not just OPEN) - so we always show crowd data for all
        const temples = await Temple.find({}).select('name location capacity status');

        // Get live count for each temple from Redis
        const templeStats = await Promise.all(
            temples.map(async (temple) => {
                const liveCount = await crowdTracker.getCurrentCount(temple._id.toString());
                const thresholds = await crowdTracker.checkThresholds(temple._id.toString(), liveCount);
                const cap = typeof temple.capacity === 'number' ? temple.capacity : (temple.capacity?.total || 1000);

                return {
                    temple_id: temple._id,
                    temple_name: temple.name,
                    location: (temple.location && typeof temple.location === 'object' ? temple.location.city : null) || 'Unknown',
                    live_count: liveCount,
                    capacity: cap,
                    capacity_percentage: thresholds.percentage,
                    traffic_status: thresholds.status,
                    status: temple.status || 'OPEN',
                    available_space: cap - liveCount
                };
            })
        );

        // Summary stats
        const totalVisitors = templeStats.reduce((acc, t) => acc + t.live_count, 0);
        const totalCapacity = templeStats.reduce((acc, t) => acc + t.capacity, 0);

        res.status(200).json({
            success: true,
            data: {
                temples: templeStats,
                summary: {
                    total_temples: templeStats.length,
                    total_visitors: totalVisitors,
                    total_capacity: totalCapacity,
                    overall_percentage: totalCapacity > 0 ? Math.round((totalVisitors / totalCapacity) * 100) : 0
                },
                last_updated: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error getting all live data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch live data'
        });
    }
};

// @desc    Record Temple Entry (Gatekeeper scans entry QR)
// @route   POST /api/v1/live/entry
// @access  Private (Gatekeeper/Admin)
exports.recordEntry = async (req, res) => {
    try {
        const { templeId, passId } = req.body;

        // Validation
        if (!templeId || !passId) {
            return res.status(400).json({
                success: false,
                error: 'Temple ID and Pass ID are required'
            });
        }

        // 1. Verify temple exists
        const temple = await Temple.findById(templeId);
        if (!temple) {
            return res.status(404).json({
                success: false,
                error: 'Temple not found'
            });
        }

        // 2. Verify booking exists and is valid
        const booking = await Booking.findOne({ passId });
        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Invalid pass ID - booking not found'
            });
        }

        // 3. Check booking status
        if (booking.status === 'CANCELLED') {
            return res.status(400).json({
                success: false,
                error: 'This booking has been cancelled'
            });
        }

        if (booking.status === 'COMPLETED') {
            return res.status(400).json({
                success: false,
                error: 'This pass has already been used'
            });
        }

        // 4. Record entry in Redis (with duplicate prevention)
        const result = await crowdTracker.recordEntry(templeId, booking._id.toString());

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error
            });
        }

        // 5. Update booking status
        booking.status = 'COMPLETED';
        booking.entryTime = new Date();
        await booking.save();

        // 6. Respond with success
        res.status(200).json({
            success: true,
            message: 'Entry recorded successfully',
            data: {
                count: result.live_count, // For test compatibility
                booking: {
                    id: booking._id,
                    passId: booking.passId,
                    userName: booking.userName,
                    userEmail: booking.userEmail,
                    entryTime: booking.entryTime
                },
                temple: {
                    name: temple.name,
                    live_count: result.live_count,
                    capacity_percentage: result.percentage,
                    traffic_status: result.status
                },
                alert: result.alert // Will be present if threshold reached
            }
        });

    } catch (error) {
        console.error('❌ Error recording entry:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to record entry'
        });
    }
};

// @desc    Record Temple Exit (Gatekeeper scans exit QR)
// @route   POST /api/v1/live/exit
// @access  Private (Gatekeeper/Admin)
exports.recordExit = async (req, res) => {
    try {
        const { templeId, passId } = req.body;

        // Validation
        if (!templeId || !passId) {
            return res.status(400).json({
                success: false,
                error: 'Temple ID and Pass ID are required'
            });
        }

        // 1. Verify booking exists
        const booking = await Booking.findOne({ passId });
        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Invalid pass ID'
            });
        }

        // 2. Record exit in Redis (with validation)
        const result = await crowdTracker.recordExit(templeId, booking._id.toString());

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error
            });
        }

        // 3. Update booking with exit time
        booking.exitTime = new Date();
        await booking.save();

        // 4. Respond with success
        res.status(200).json({
            success: true,
            message: 'Exit recorded successfully',
            data: {
                count: result.live_count, // For test compatibility
                booking: {
                    id: booking._id,
                    passId: booking.passId,
                    entryTime: booking.entryTime,
                    exitTime: booking.exitTime
                },
                temple: {
                    live_count: result.live_count,
                    capacity_percentage: result.percentage,
                    traffic_status: result.status
                }
            }
        });

    } catch (error) {
        console.error('❌ Error recording exit:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to record exit'
        });
    }
};

// @desc    Get Live Crowd Data for Dashboard
// @route   GET /api/v1/live/:templeId
// @access  Public (Dashboard displays this to everyone)
exports.getLiveCrowdData = async (req, res) => {
    try {
        const { templeId } = req.params;

        // 1. Get temple details
        const temple = await Temple.findById(templeId);
        if (!temple) {
            return res.status(404).json({
                success: false,
                error: 'Temple not found'
            });
        }

        // 2. Get current count from Redis (super fast!)
        const liveCount = await crowdTracker.getCurrentCount(templeId);

        // 3. Calculate percentage and status
        const thresholds = await crowdTracker.checkThresholds(templeId, liveCount);

        // 4. Respond with dashboard data
        res.status(200).json({
            success: true,
            data: {
                current_count: liveCount, // For test compatibility
                temple_id: temple._id,
                temple_name: temple.name,
                location: temple.location.city,
                live_count: liveCount,
                total_capacity: temple.capacity.total,
                available_space: temple.capacity.total - liveCount,
                capacity_percentage: thresholds.percentage,
                traffic_status: thresholds.status,
                thresholds: {
                    warning: temple.capacity.threshold_warning,
                    critical: temple.capacity.threshold_critical
                },
                last_updated: new Date().toISOString(),
                alert: thresholds.alert
            }
        });

    } catch (error) {
        console.error('❌ Error getting live crowd data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch live data'
        });
    }
};

// @desc    Reset Temple Count (Admin Emergency Operation)
// @route   POST /api/v1/live/reset/:templeId
// @access  Private (Admin only)
exports.resetTempleCount = async (req, res) => {
    try {
        const { templeId } = req.params;

        // Verify temple exists
        const temple = await Temple.findById(templeId);
        if (!temple) {
            return res.status(404).json({
                success: false,
                error: 'Temple not found'
            });
        }

        // Reset count to 0
        await crowdTracker.resetCount(templeId);

        res.status(200).json({
            success: true,
            message: `Count reset for ${temple.name}`,
            data: {
                temple_name: temple.name,
                live_count: 0
            }
        });

    } catch (error) {
        console.error('❌ Error resetting count:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reset count'
        });
    }
};

// @desc    Get All People Currently Inside Temple
// @route   GET /api/v1/live/:templeId/entries
// @access  Private (Admin/Gatekeeper)
exports.getCurrentEntries = async (req, res) => {
    try {
        const { templeId } = req.params;

        const temple = await Temple.findById(templeId);
        if (!temple) {
            return res.status(404).json({
                success: false,
                error: 'Temple not found'
            });
        }

        // Get booking IDs of people inside
        const bookingIds = await crowdTracker.getCurrentEntries(templeId);

        // Fetch booking details
        const bookings = await Booking.find({
            _id: { $in: bookingIds }
        }).select('userName userEmail passId entryTime');

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });

    } catch (error) {
        console.error('❌ Error getting entries:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch entries'
        });
    }
};

// @desc    Get Daily Stats (Total Entries/Exits Today)
// @route   GET /api/v1/live/:templeId/stats
// @access  Private (Gatekeeper/Admin)
exports.getDailyStats = async (req, res) => {
    try {
        const { templeId } = req.params;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const temple = await Temple.findById(templeId);
        if (!temple) {
            return res.status(404).json({ success: false, error: 'Temple not found' });
        }

        // Live count from Redis
        const liveCount = await crowdTracker.getCurrentCount(templeId);

        // Database aggregation for today's stats
        const stats = await Booking.aggregate([
            {
                $match: {
                    temple: temple._id,
                    $or: [
                        { entryTime: { $gte: today, $lt: tomorrow } },
                        { exitTime: { $gte: today, $lt: tomorrow } }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    totalEntries: {
                        $sum: { $cond: [{ $ifNull: ['$entryTime', false] }, 1, 0] }
                    },
                    totalExits: {
                        $sum: { $cond: [{ $ifNull: ['$exitTime', false] }, 1, 0] }
                    }
                }
            }
        ]);

        const result = stats[0] || { totalEntries: 0, totalExits: 0 };

        res.status(200).json({
            success: true,
            data: {
                temple_name: temple.name,
                live_count: liveCount,
                today_entries: result.totalEntries,
                today_exits: result.totalExits,
                timestamp: new Date()
            }
        });

    } catch (error) {
        console.error('❌ Error getting daily stats:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch daily stats' });
    }
};
