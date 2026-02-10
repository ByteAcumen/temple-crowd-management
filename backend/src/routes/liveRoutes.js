const express = require('express');
const router = express.Router();
const {
    getAllLiveData,
    recordEntry,
    recordExit,
    getLiveCrowdData,
    resetTempleCount,
    getCurrentEntries,
    getDailyStats
} = require('../controllers/liveController');
const { protect, authorize } = require('../middleware/auth');

/**
 * Live Crowd Monitoring Routes
 * 
 * PUBLIC ROUTES:
 * - GET /:templeId - Dashboard live data (anyone can view)
 * 
 * GATEKEEPER ROUTES:
 * - POST /entry - Record temple entry (QR scan)
 * - POST /exit - Record temple exit (QR scan)
 * - GET /:templeId/entries - See who's inside
 * - GET /:templeId/stats - Get daily entry/exit totals
 * 
 * ADMIN ROUTES:
 * - POST /reset/:templeId - Emergency reset count
 */

// PUBLIC: Get all temples live status (dashboard overview)
router.get('/', getAllLiveData);

// PUBLIC: Get live crowd data for specific temple
router.get('/:templeId', getLiveCrowdData);

// GATEKEEPER/ADMIN: Entry/Exit operations
router.post('/entry', protect, authorize('gatekeeper', 'admin'), recordEntry);
router.post('/exit', protect, authorize('gatekeeper', 'admin'), recordExit);
router.get('/:templeId/entries', protect, authorize('gatekeeper', 'admin'), getCurrentEntries);
router.get('/:templeId/stats', protect, authorize('gatekeeper', 'admin'), getDailyStats);

// ADMIN ONLY: Reset count
router.post('/reset/:templeId', protect, authorize('admin'), resetTempleCount);

module.exports = router;
