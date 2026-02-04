const express = require('express');
const router = express.Router();
const {
    recordEntry,
    recordExit,
    getLiveCrowdData,
    resetTempleCount,
    getCurrentEntries
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
 * 
 * ADMIN ROUTES:
 * - POST /reset/:templeId - Emergency reset count
 */

// PUBLIC: Get live crowd data for dashboard display
router.get('/:templeId', getLiveCrowdData);

// GATEKEEPER/ADMIN: Entry/Exit operations
router.post('/entry', protect, authorize('gatekeeper', 'admin'), recordEntry);
router.post('/exit', protect, authorize('gatekeeper', 'admin'), recordExit);
router.get('/:templeId/entries', protect, authorize('gatekeeper', 'admin'), getCurrentEntries);

// ADMIN ONLY: Reset count
router.post('/reset/:templeId', protect, authorize('admin'), resetTempleCount);

module.exports = router;
