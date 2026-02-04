const express = require('express');
const router = express.Router();
const {
    createBooking,
    getMyBookings,
    cancelBooking,
    checkAvailability,
    getBookingByPassId,
    getBooking
} = require('../controllers/bookingController');

const { protect, authorize } = require('../middleware/auth');

/**
 * BOOKING ROUTES - Enhanced
 * 
 * PUBLIC ROUTES:
 * - GET /availability - Check slot availability
 * - GET /pass/:passId - QR code lookup
 * 
 * PROTECTED ROUTES:
 * - POST / - Create booking
 * - GET / - Get user bookings
 * - GET /:id - Get single booking
 * - DELETE /:id - Cancel booking
 */

// PUBLIC: Check slot availability (before booking)
router.get('/availability', checkAvailability);

// PUBLIC: QR code lookup (gatekeeper verifies pass)
router.get('/pass/:passId', getBookingByPassId);

// PROTECTED: Booking management (user must be logged in)
router.route('/')
    .post(protect, createBooking)
    .get(protect, getMyBookings);

router.route('/:id')
    .get(protect, getBooking)
    .delete(protect, cancelBooking);

module.exports = router;
