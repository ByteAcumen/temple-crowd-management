const express = require('express');
const router = express.Router();
const {
    getStats,
    getAnalytics,
    getTempleReport,
    getUserManagement,
    createUser,
    getBookingManagement,
    getSystemHealth,
    getAdminUsers,
    updateUserTemples,
    deleteUser,
    searchDevotees
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/auth');

/**
 * ADMIN ROUTES
 * 
 * All routes protected with admin-only authorization
 * Provides statistics, analytics, and management capabilities
 * 
 * Super Admin routes are marked with (Super Admin) - require isSuperAdmin: true
 */

// Protect all admin routes
router.use(protect);

// Gatekeeper Search - Must be defined BEFORE specific admin-only authorization
router.get('/devotees/search', authorize('admin', 'gatekeeper'), searchDevotees);

// Require Admin role for all subsequent routes
router.use(authorize('admin'));

// Dashboard & Statistics
router.get('/stats', getStats);
router.get('/analytics', getAnalytics);
router.get('/health', getSystemHealth);

// Temple Reports
router.get('/temples/:id/report', getTempleReport);

// User Management (Admin can create gatekeeper/admin accounts)
router.get('/users', getUserManagement);
router.post('/users', createUser);

// Super Admin Only - Admin Management
router.get('/admins', getAdminUsers);                    // List all admins (Super Admin)
router.put('/users/:id/temples', updateUserTemples);     // Assign temples (Super Admin)
router.delete('/users/:id', deleteUser);                 // Delete user (Super Admin)

// Booking Management
router.get('/bookings', getBookingManagement);

// Booking Management
router.get('/bookings', getBookingManagement);

module.exports = router;
