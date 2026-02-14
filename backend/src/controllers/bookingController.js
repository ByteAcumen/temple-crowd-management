const Booking = require('../models/Booking');
const Temple = require('../models/Temple');
const axios = require('axios');

/**
 * BOOKING CONTROLLER - Enhanced
 * 
 * NEW FEATURES:
 * - Slot capacity validation (prevent overbooking)
 * - Cancel booking
 * - Check availability
 * - QR lookup for gatekeepers
 */

// @desc    Create a new booking (with Slot Capacity Validation)
// @route   POST /api/v1/bookings
// @access  Public
exports.createBooking = async (req, res) => {
    try {
        const { templeId, templeName, date, visitors, payment, specialPuja, temperature, rain_flag, visitorDetails } = req.body;

        // Support both 'slot' and 'timeSlot' field names for compatibility
        const slot = req.body.slot || req.body.timeSlot;

        let { userName, userEmail } = req.body;

        // Fallback to authenticated user details if missing
        if (!userEmail && req.user) {
            userEmail = req.user.email;
        }
        if (!userName && req.user) {
            userName = req.user.name;
        }

        // --- 1. VALIDATE TEMPLE EXISTS ---
        const temple = await Temple.findById(templeId);
        if (!temple) {
            return res.status(404).json({
                success: false,
                error: 'Temple not found'
            });
        }

        // --- 2. CHECK SLOT AVAILABILITY (CRITICAL - Prevent Overbooking!) ---
        const existingBookings = await Booking.countDocuments({
            temple: templeId,
            date: new Date(date),
            slot,
            status: 'CONFIRMED' // Only count active bookings
        });

        const slotCapacity = temple.capacity.per_slot;
        const availableSpace = slotCapacity - existingBookings;

        if (visitors > availableSpace) {
            return res.status(400).json({
                success: false,
                error: 'Slot is full or insufficient space',
                details: {
                    slot_capacity: slotCapacity,
                    already_booked: existingBookings,
                    available_space: availableSpace,
                    requested: visitors
                }
            });
        }

        // --- 3. AI PREDICTION CHECK (Optional) ---
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://ai-service:8000';
        let crowdStatus = 'Normal';
        let predictedFootfall = 0;

        try {
            const dt = new Date(date);
            const isWeekend = (dt.getDay() === 0 || dt.getDay() === 6) ? 1 : 0;

            console.log(`🤖 Consulting AI Brain for ${templeName} on ${date}...`);

            const aiResponse = await axios.post(`${aiServiceUrl}/predict`, {
                temple_name: templeName,
                date_str: date,
                temperature: temperature || 30,
                rain_flag: rain_flag || 0,
                moon_phase: 'Normal',
                is_weekend: isWeekend
            });

            crowdStatus = aiResponse.data.crowd_status;
            predictedFootfall = aiResponse.data.predicted_visitors;

            console.log(`🧠 AI Verdict: ${crowdStatus} (${predictedFootfall} visitors)`);

        } catch (error) {
            console.error('⚠️ AI Service Unavailable:', error.message);
        }

        // --- 4. CAPACITY GUARD (AI-based) ---
        if (crowdStatus === 'CRITICAL') {
            return res.status(400).json({
                success: false,
                message: 'Booking Failed: Temple is at CRITICAL capacity for this date.',
                reason: 'AI Crowd Guard Blocked Request',
                prediction: predictedFootfall
            });
        }

        // --- 5. CREATE BOOKING ---
        const newBooking = await Booking.create({
            temple: templeId,
            templeName,
            date,
            slot,
            visitors,
            visitorDetails: visitorDetails || [],  // Include visitor details
            userName,
            userEmail,
            payment: payment || undefined, // Pass payment if provided
            userId: req.user ? req.user._id : null // Link to user if authenticated
        });

        // Populate temple details
        await newBooking.populate('temple', 'name location capacity');

        // === NOTIFICATIONS & REAL-TIME UPDATES ===
        try {
            // Send booking confirmation email (async, don't block response)
            const notificationService = require('../services/NotificationService');
            notificationService.sendBookingConfirmation(newBooking, temple)
                .catch(err => console.error('Email notification failed:', err));

            // Broadcast to admin dashboard via WebSocket
            const socketEvents = req.app.get('socketEvents');
            if (socketEvents) {
                socketEvents.emitBookingCreated(newBooking);
            }
        } catch (notifError) {
            console.error('⚠️ Notification/WebSocket error:', notifError);
            // Don't fail the booking if notifications fail
        }

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: newBooking,
            ai_insight: {
                status: crowdStatus,
                predicted_footfall: predictedFootfall
            },
            slot_info: {
                capacity: slotCapacity,
                remaining: availableSpace - visitors
            }
        });

    } catch (error) {
        console.error('❌ Error creating booking:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get user bookings
// @route   GET /api/v1/bookings
// @access  Private
exports.getMyBookings = async (req, res) => {
    try {
        // Build query: match either userId or userEmail
        const query = {};

        if (req.user) {
            // If authenticated, find by userId OR email (in case legacy data only has email)
            query.$or = [
                { userId: req.user._id },
                { userEmail: req.user.email }
            ];
        } else if (req.query.email) {
            // Fallback for non-auth calls (if any, though this route is private)
            query.userEmail = req.query.email;
        } else {
            return res.status(400).json({ error: 'User must be logged in or provide email' });
        }

        const bookings = await Booking.find(query)
            .populate('temple', 'name location')
            .sort({ date: -1 });

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Cancel Booking (User can cancel their own booking)
// @route   DELETE /api/v1/bookings/:id
// @access  Private (User must own booking or be admin)
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }

        // Authorization: User owns booking or is admin
        const isOwner = booking.userEmail === req.user.email;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to cancel this booking'
            });
        }

        // Check if already cancelled
        if (booking.status === 'CANCELLED') {
            return res.status(400).json({
                success: false,
                error: 'Booking already cancelled'
            });
        }

        // Check if already completed (can't cancel after visiting)
        if (booking.status === 'COMPLETED') {
            return res.status(400).json({
                success: false,
                error: 'Cannot cancel completed booking'
            });
        }

        // Update status
        booking.status = 'CANCELLED';
        await booking.save();

        // TODO: Trigger refund if payment was made
        if (booking.payment.status === 'PAID') {
            booking.payment.status = 'REFUNDED';
            await booking.save();
            console.log(`💰 Refund initiated for booking ${booking.passId}`);
        }

        // === NOTIFICATIONS & REAL-TIME UPDATES ===
        try {
            // Populate temple for notification
            await booking.populate('temple', 'name location');

            // Send cancellation email (async)
            const notificationService = require('../services/NotificationService');
            notificationService.sendCancellationNotification(booking, booking.temple)
                .catch(err => console.error('Cancellation email failed:', err));

            // Broadcast to admin dashboard
            const socketEvents = req.app.get('socketEvents');
            if (socketEvents) {
                socketEvents.emitBookingCancelled(booking);
            }
        } catch (notifError) {
            console.error('⚠️ Notification error:', notifError);
        }

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully',
            data: booking
        });

    } catch (error) {
        console.error('❌ Error cancelling booking:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Check Slot Availability
// @route   GET /api/v1/bookings/availability
// @access  Public
exports.checkAvailability = async (req, res) => {
    try {
        const { templeId, date, slot } = req.query;

        // Validation
        if (!templeId || !date || !slot) {
            return res.status(400).json({
                success: false,
                error: 'templeId, date, and slot are required'
            });
        }

        // Get temple
        const temple = await Temple.findById(templeId);
        if (!temple) {
            return res.status(404).json({
                success: false,
                error: 'Temple not found'
            });
        }

        // Count existing bookings for this slot
        const bookedCount = await Booking.countDocuments({
            temple: templeId,
            date: new Date(date),
            slot,
            status: 'CONFIRMED'
        });

        const slotCapacity = temple.capacity.per_slot;
        const available = slotCapacity - bookedCount;

        res.status(200).json({
            success: true,
            data: {
                temple_name: temple.name,
                date,
                slot,
                total_capacity: slotCapacity,
                booked: bookedCount,
                available,
                status: available > 0 ? 'AVAILABLE' : 'FULL',
                percentage_full: ((bookedCount / slotCapacity) * 100).toFixed(1)
            }
        });

    } catch (error) {
        console.error('❌ Error checking availability:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get Booking by Pass ID (for QR code verification)
// @route   GET /api/v1/bookings/pass/:passId
// @access  Public (Gatekeeper needs this for QR scanning)
exports.getBookingByPassId = async (req, res) => {
    try {
        const { passId } = req.params;

        const booking = await Booking.findOne({ passId })
            .populate('temple', 'name location capacity');

        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found - Invalid QR code'
            });
        }



        // Return booking directly - toJSON method will handle formatting
        res.status(200).json({
            success: true,
            data: booking
        });

    } catch (error) {
        console.error('❌ Error fetching booking:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get Single Booking by ID
// @route   GET /api/v1/bookings/:id
// @access  Private (User must own booking or be admin)
exports.getBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('temple', 'name location capacity status');

        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }

        // Authorization check
        const isOwner = booking.userEmail === req.user.email;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to view this booking'
            });
        }

        res.status(200).json({
            success: true,
            data: booking
        });

    } catch (error) {
        console.error('❌ Error fetching booking:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
