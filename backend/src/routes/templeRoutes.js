const express = require('express');
const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const { cache, clearCache } = require('../middleware/cache');

// Import controller functions
const {
    createTemple,
    getAllTemples,
    getTemple,
    updateTemple,
    deleteTemple,
    getTempleLiveStatus
} = require('../controllers/templeController');

const templeStatusService = require('../services/TempleStatusService');

/**
 * TEMPLE ROUTES
 * 
 * This file maps URLs to controller functions
 */

// ==========================================
// BASE ROUTE: /api/v1/temples
// ==========================================
router.route('/')
    // GET all temples (Public - cached for 30 seconds)
    .get(cache(30), getAllTemples)

    // POST create new temple (Admin only)
    .post(protect, authorize('admin'), createTemple);

// ==========================================
// AUTO-STATUS UPDATE: /api/v1/temples/sync-status
// ==========================================
// POST trigger manual status sync (Admin only)
router.post('/sync-status', protect, authorize('admin'), async (req, res) => {
    try {
        const results = await templeStatusService.updateAllTemplesStatus();
        res.json({ success: true, message: 'Temple statuses synchronized', data: results });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==========================================
// LIVE STATUS: /api/v1/temples/:id/live
// ==========================================
// GET live crowd status (Public - for dashboards)
router.get('/:id/live', getTempleLiveStatus);

// ==========================================
// PREDICTIONS: /api/v1/temples/:id/predictions
// ==========================================
// GET crowd predictions and recommendations
router.get('/:id/predictions', async (req, res) => {
    try {
        console.log('🔮 Fetching predictions for:', req.params.id);
        const predictions = await templeStatusService.getTemplePredictions(req.params.id);
        res.json({ success: true, data: predictions });
    } catch (error) {
        console.error('❌ Prediction Error:', error);
        res.status(404).json({ success: false, message: error.message });
    }
});

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

module.exports = router;
