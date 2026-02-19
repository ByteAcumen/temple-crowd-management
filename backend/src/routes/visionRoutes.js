const express = require('express');
const router = express.Router();
const { analyzeCrowd } = require('../controllers/visionController');
const { protect, authorize } = require('../middleware/auth');

// POST /api/vision/analyze
// Protected route: Only Admins and Gatekeepers can analyze crowd
router.post('/analyze', protect, authorize('admin', 'gatekeeper'), analyzeCrowd);

module.exports = router;
