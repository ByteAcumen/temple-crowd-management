const express = require('express');
const router = express.Router();
const { recordEntry, recordExit, getLiveStatus } = require('../controllers/liveController');
const { protect, authorize } = require('../middleware/auth');

// All live routes are protected and restricted to Staff
router.use(protect);
router.use(authorize('admin', 'gatekeeper'));

router.post('/entry', recordEntry);
router.post('/exit', recordExit);
router.get('/status', getLiveStatus);

module.exports = router;
