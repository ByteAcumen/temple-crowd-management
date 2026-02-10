const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const bookingSchema = new mongoose.Schema({
    // Temple reference (REQUIRED for slot capacity validation)
    temple: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Temple',
        required: [true, 'Temple ID is required']
    },
    templeName: {
        type: String,
        required: [true, 'Please select a temple'],
        trim: true
    },
    // User reference (for linking bookings to users)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Allow guest bookings
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
    // Payment tracking (NEW - Enhanced Booking)
    payment: {
        amount: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: ['PENDING', 'PAID', 'REFUNDED', 'FAILED'],
            default: 'PENDING'
        },
        transaction_id: {
            type: String,
            default: null
        },
        payment_method: {
            type: String,
            enum: ['CARD', 'UPI', 'CASH', 'FREE'],
            default: 'FREE'
        },
        paid_at: {
            type: Date,
            default: null
        }
    },
    // QR Code image URL (NEW - for frontend display)
    qr_code_url: {
        type: String,
        default: null
    },
    // Entry/Exit tracking (for Live Crowd Tracking)
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

// Performance Indexes (CRITICAL for fast queries)
// Note: passId already has unique index from schema definition
bookingSchema.index({ userId: 1, date: -1 }); // Fast user booking history
bookingSchema.index({ temple: 1, date: 1, slot: 1 }); // Fast slot availability check
bookingSchema.index({ userEmail: 1, date: -1 }); // Fast email lookup
bookingSchema.index({ status: 1, date: 1 }); // Fast status filtering

// Virtual property: Calculate booking total cost
bookingSchema.virtual('total_cost').get(function () {
    return this.payment.amount * this.visitors;
});

// Virtual property: Check if booking is active
bookingSchema.virtual('is_active').get(function () {
    return this.status === 'CONFIRMED' && new Date(this.date) >= new Date();
});

// Pre-save hook: Generate QR code URL if not exists
bookingSchema.pre('save', function (next) {
    if (!this.qr_code_url && this.passId) {
        // Generate QR code URL using API (future: integrate QR service)
        this.qr_code_url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${this.passId}`;
    }
    next();
});

module.exports = mongoose.model('Booking', bookingSchema);
