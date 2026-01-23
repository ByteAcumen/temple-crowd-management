const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/botController');

router.post('/query', chat);

module.exports = router;
