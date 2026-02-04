const User = require('../models/User');
const Temple = require('../models/Temple');
const Booking = require('../models/Booking');
const crowdTracker = require('../services/CrowdTracker');

/**
 * ADMIN DASHBOARD CONTROLLER
 * 
 * Provides comprehensive statistics and analytics for admin users
 * All endpoints restricted to admin role only
 */

// @desc    Get Overall Dashboard Statistics
// @route   GET /api/v1/admin/stats
// @access  Private (Admin only)
exports.getStats = async (req, res) => {
    try {
        // Calculate date ranges
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const todayEnd = new Date(now.setHours(23, 59, 59, 999));
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Parallel queries for performance
        const [
            totalBookings,
            totalUsers,
            totalTemples,
            todayBookings,
            monthBookings,
            activeBookings,
            cancelledBookings,
            completedBookings,
            totalRevenue
        ] = await Promise.all([
            Booking.countDocuments(),
            User.countDocuments(),
            Temple.countDocuments(),
            Booking.countDocuments({
                createdAt: { $gte: todayStart, $lte: todayEnd }
            }),
            Booking.countDocuments({
                createdAt: { $gte: monthStart }
            }),
            Booking.countDocuments({ status: 'CONFIRMED' }),
            Booking.countDocuments({ status: 'CANCELLED' }),
            Booking.countDocuments({ status: 'COMPLETED' }),
            Booking.aggregate([
                { $match: { 'payment.status': 'PAID' } },
                { $group: { _id: null, total: { $sum: '$payment.amount' } } }
            ])
        ]);

        // Get temples with live crowd data
        const temples = await Temple.find().select('name live_count capacity');
        let totalLiveCrowd = 0;
        let totalCapacity = 0;

        temples.forEach(temple => {
            totalLiveCrowd += temple.live_count || 0;
            totalCapacity += temple.capacity.total;
        });

        const systemOccupancy = totalCapacity > 0 ?
            ((totalLiveCrowd / totalCapacity) * 100).toFixed(1) : 0;

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    total_bookings: totalBookings,
                    total_users: totalUsers,
                    total_temples: totalTemples,
                    total_revenue: totalRevenue[0]?.total || 0
                },
                bookings: {
                    today: todayBookings,
                    this_month: monthBookings,
                    active: activeBookings,
                    cancelled: cancelledBookings,
                    completed: completedBookings
                },
                crowd: {
                    current_live_count: totalLiveCrowd,
                    total_capacity: totalCapacity,
                    occupancy_percentage: systemOccupancy,
                    status: systemOccupancy >= 85 ? 'HIGH' : systemOccupancy >= 60 ? 'MODERATE' : 'LOW'
                },
                timestamp: new Date()
            }
        });

    } catch (error) {
        console.error('❌ Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard statistics'
        });
    }
};

// @desc    Get Crowd Analytics
// @route   GET /api/v1/admin/analytics
// @access  Private (Admin only)
exports.getAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Default to last 30 days if not specified
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        // 1. Peak Hours Analysis
        const peakHours = await Booking.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: '$slot',
                    count: { $sum: 1 },
                    total_visitors: { $sum: '$visitors' }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 5
            }
        ]);

        // 2. Most Popular Temples
        const popularTemples = await Booking.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: '$templeName',
                    booking_count: { $sum: 1 },
                    total_visitors: { $sum: '$visitors' },
                    revenue: { $sum: '$payment.amount' }
                }
            },
            {
                $sort: { booking_count: -1 }
            },
            {
                $limit: 5
            }
        ]);

        // 3. Booking Trends by Day
        const trendsByDay = await Booking.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // 4. Revenue Breakdown
        const revenueByTemple = await Booking.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    'payment.status': 'PAID'
                }
            },
            {
                $group: {
                    _id: '$templeName',
                    revenue: { $sum: '$payment.amount' },
                    bookings: { $sum: 1 }
                }
            },
            {
                $sort: { revenue: -1 }
            }
        ]);

        res.status(200).json({
            success: true,
            period: {
                start_date: start,
                end_date: end
            },
            data: {
                peak_hours: peakHours,
                popular_temples: popularTemples,
                daily_trends: trendsByDay,
                revenue_by_temple: revenueByTemple
            }
        });

    } catch (error) {
        console.error('❌ Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics'
        });
    }
};

// @desc    Get Temple Report (Individual Temple Analytics)
// @route   GET /api/v1/admin/temples/:id/report
// @access  Private (Admin only)
exports.getTempleReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;

        // Get temple details
        const temple = await Temple.findById(id);
        if (!temple) {
            return res.status(404).json({
                success: false,
                error: 'Temple not found'
            });
        }

        // Date range
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        // Get bookings for this temple
        const bookings = await Booking.find({
            temple: id,
            createdAt: { $gte: start, $lte: end }
        });

        const totalBookings = bookings.length;
        const totalVisitors = bookings.reduce((sum, b) => sum + b.visitors, 0);
        const totalRevenue = bookings
            .filter(b => b.payment.status === 'PAID')
            .reduce((sum, b) => sum + b.payment.amount, 0);

        // Status breakdown
        const confirmed = bookings.filter(b => b.status === 'CONFIRMED').length;
        const cancelled = bookings.filter(b => b.status === 'CANCELLED').length;
        const completed = bookings.filter(b => b.status === 'COMPLETED').length;

        // Average capacity utilization
        const avgUtilization = totalBookings > 0 ?
            ((totalVisitors / (temple.capacity.per_slot * totalBookings)) * 100).toFixed(1) : 0;

        // Get current live count
        const liveCount = await crowdTracker.getCurrentCount(id);
        const currentOccupancy = ((liveCount / temple.capacity.total) * 100).toFixed(1);

        res.status(200).json({
            success: true,
            temple: {
                id: temple._id,
                name: temple.name,
                location: temple.location,
                capacity: temple.capacity
            },
            period: {
                start_date: start,
                end_date: end
            },
            statistics: {
                total_bookings: totalBookings,
                total_visitors: totalVisitors,
                total_revenue: totalRevenue,
                average_utilization: avgUtilization
            },
            booking_status: {
                confirmed,
                cancelled,
                completed
            },
            live_data: {
                current_count: liveCount,
                capacity: temple.capacity.total,
                occupancy_percentage: currentOccupancy,
                traffic_status: temple.traffic_status || 'GREEN'
            }
        });

    } catch (error) {
        console.error('❌ Error fetching temple report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch temple report'
        });
    }
};

// @desc    Get All Users (User Management)
// @route   GET /api/v1/admin/users
// @access  Private (Admin only)
exports.getUserManagement = async (req, res) => {
    try {
        const { page = 1, limit = 50, role, search } = req.query;

        // Build query
        const query = {};
        if (role) query.role = role;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            count,
            pages: Math.ceil(count / limit),
            current_page: parseInt(page),
            data: users
        });

    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
};

// @desc    Get All Bookings (Booking Management)
// @route   GET /api/v1/admin/bookings
// @access  Private (Admin only)
exports.getBookingManagement = async (req, res) => {
    try {
        const { page = 1, limit = 50, status, temple, date } = req.query;

        // Build query
        const query = {};
        if (status) query.status = status;
        if (temple) query.temple = temple;
        if (date) {
            const targetDate = new Date(date);
            const nextDate = new Date(targetDate);
            nextDate.setDate(nextDate.getDate() + 1);
            query.date = { $gte: targetDate, $lt: nextDate };
        }

        const bookings = await Booking.find(query)
            .populate('temple', 'name location')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Booking.countDocuments(query);

        res.status(200).json({
            success: true,
            count,
            pages: Math.ceil(count / limit),
            current_page: parseInt(page),
            data: bookings
        });

    } catch (error) {
        console.error('❌ Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch bookings'
        });
    }
};

// @desc    Get System Health
// @route   GET /api/v1/admin/health
// @access  Private (Admin only)
exports.getSystemHealth = async (req, res) => {
    try {
        // Check database connection
        const dbStatus = 'connected'; // If this runs, DB is connected

        // Check Redis (via crowdTracker)
        let redisStatus = 'unknown';
        try {
            await crowdTracker.getCurrentCount('test');
            redisStatus = 'connected';
        } catch {
            redisStatus = 'disconnected';
        }

        // Get server uptime
        const uptime = process.uptime();

        res.status(200).json({
            success: true,
            data: {
                status: 'healthy',
                database: dbStatus,
                redis: redisStatus,
                uptime_seconds: uptime,
                uptime_formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
                memory_usage: process.memoryUsage(),
                timestamp: new Date()
            }
        });

    } catch (error) {
        console.error('❌ Error checking system health:', error);
        res.status(500).json({
            success: false,
            error: 'System health check failed'
        });
    }
};
