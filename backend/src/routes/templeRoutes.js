const express = require('express');
const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/auth');

// Import controller functions
const {
    createTemple,
    getAllTemples,
    getTemple,
    updateTemple,
    deleteTemple,
    getTempleLiveStatus
} = require('../controllers/templeController');

/**
 * TEMPLE ROUTES
 * 
 * This file maps URLs to controller functions
 * Think of it as a "directory" that tells Express:
 * "When someone goes to /api/v1/temples, run getAllTemples function"
 * 
 * ROUTE PROTECTION:
 * - Public routes: Anyone can access
 * - protect: Requires login (JWT token)
 * - authorize('admin'): Requires admin role
 */

// ==========================================
// BASE ROUTE: /api/v1/temples
// ==========================================
router.route('/')
    // GET all temples (Public - anyone can view temples)
    .get(getAllTemples)

    // POST create new temple (Admin only)
    .post(protect, authorize('admin'), createTemple);

// ==========================================
// SINGLE TEMPLE: /api/v1/temples/:id
// ==========================================
router.route('/:id')
    // GET one temple (Public - anyone can view)
    .get(getTemple)

    // PUT update temple (Admin only)
    .put(protect, authorize('admin'), updateTemple)

    // DELETE remove temple (Admin only)
    .delete(protect, authorize('admin'), deleteTemple);

// ==========================================
// LIVE STATUS: /api/v1/temples/:id/live
// ==========================================
// GET live crowd status (Public - for dashboards)
router.get('/:id/live', getTempleLiveStatus);

/**
 * HOW THIS WORKS:
 * 
 * 1. User visits: GET /api/v1/temples
 *    → Runs getAllTemples (no login required)
 * 
 * 2. Admin posts: POST /api/v1/temples
 *    → protect checks JWT token
 *    → authorize checks if user.role === 'admin'
 *    → If both pass, runs createTemple
 * 
 * 3. Public visits: GET /api/v1/temples/123abc/live
 *    → Runs getTempleLiveStatus (shows crowd % and traffic light)
 * 
 * MIDDLEWARE ORDER MATTERS:
 * protect comes before authorize (must login before checking role)
 */

module.exports = router;
