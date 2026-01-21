const express = require('express');
const router = express.Router();
const { createBooking, getMyBookings } = require('../controllers/bookingController');

router.post('/', createBooking);
router.get('/', getMyBookings);

module.exports = router;
