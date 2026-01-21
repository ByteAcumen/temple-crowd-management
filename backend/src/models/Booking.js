const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const bookingSchema = new mongoose.Schema({
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent double booking for same user/slot (Optional but good)
// bookingSchema.index({ userEmail: 1, date: 1, slot: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);
