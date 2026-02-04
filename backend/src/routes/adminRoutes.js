const express = require('express');
const router = express.Router();
const {
    getStats,
    getAnalytics,
    getTempleReport,
    getUserManagement,
    getBookingManagement,
    getSystemHealth
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/auth');

/**
 * ADMIN ROUTES
 * 
 * All routes protected with admin-only authorization
 * Provides statistics, analytics, and management capabilities
 */

// Protect all admin routes
router.use(protect);
router.use(authorize('admin'));

// Dashboard & Statistics
router.get('/stats', getStats);
router.get('/analytics', getAnalytics);
router.get('/health', getSystemHealth);

// Temple Reports
router.get('/temples/:id/report', getTempleReport);

// Management
router.get('/users', getUserManagement);
router.get('/bookings', getBookingManagement);

module.exports = router;
