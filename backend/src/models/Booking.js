const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const bookingSchema = new mongoose.Schema({
    // Temple reference (NEW - for Live Crowd Tracking)
    temple: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Temple',
        required: false // Allow existing bookings without temple
    },
    templeName: {
        type: String,
        required: [true, 'Please select a temple'],
        trim: true
    },
    date: {
        type: Date,
        required: [true, 'Please select a date']
    },
    slot: {
        type: String,
        required: [true, 'Please select a time slot']
    },
    visitors: {
        type: Number,
        required: [true, 'Please enter number of visitors'],
        min: [1, 'At least 1 visitor required'],
        max: [10, 'Max 10 visitors per booking']
    },
    userName: {
        type: String,
        trim: true
    },
    userEmail: {
        type: String,
        required: [true, 'Contact email is required'],
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    status: {
        type: String,
        enum: ['CONFIRMED', 'CANCELLED', 'COMPLETED'],
        default: 'CONFIRMED'
    },
    passId: {
        type: String,
        unique: true,
        default: uuidv4 // Generates unique ID for QR Code
    },
    // Entry/Exit tracking (NEW - for Live Crowd Tracking)
    entryTime: {
        type: Date,
        default: null
    },
    exitTime: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent double booking for same user/slot (Optional but good)
// bookingSchema.index({ userEmail: 1, date: 1, slot: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);
