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
    // Individual visitor details
    visitorDetails: [{
        name: {
            type: String,
            required: [true, 'Visitor name is required'],
            trim: true
        },
        age: {
            type: Number,
            required: [true, 'Visitor age is required'],
            min: [1, 'Age must be at least 1'],
            max: [120, 'Age must be realistic']
        },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other'],
            required: [true, 'Gender is required']
        }
    }],
    userName: {
        type: String,
        required: [true, 'Please enter your name'],
        trim: true
    },
    userEmail: {
        type: String,
        required: [true, 'Please enter your email'],
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    passId: {
        type: String,
        required: true,
        unique: true,
        default: () => uuidv4() // Auto-generate unique pass ID
    },
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'USED', 'EXPIRED'],
        default: 'CONFIRMED' // Auto-confirm for now (future: payment integration)
    },
    qr_code_url: {
        type: String
    },
    payment: {
        method: String,
        amount: Number,
        status: String,
        transaction_id: String
    },
    specialPuja: String,
    // LIVE TRACKING FIELDS
    entryTime: Date,
    exitTime: Date,
    // ML Metadata
    temperature: Number,
    rain_flag: Boolean,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    // CRITICAL: Schema options for proper JSON serialization
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Performance Indexes (CRITICAL for fast queries)
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

// Transform  method - Add timeSlot alias
bookingSchema.methods.toJSON = function () {
    const obj = this.toObject({ virtuals: true });

    // Add timeSlot alias for backward compatibility
    if (obj.slot && !obj.timeSlot) {
        obj.timeSlot = obj.slot;
    }

    return obj;
};

// Pre-save hook: Generate QR code URL if not exists
bookingSchema.pre('save', function (next) {
    if (!this.qr_code_url && this.passId) {
        // Generate QR code URL using API
        this.qr_code_url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${this.passId}`;
    }
    next();
});

module.exports = mongoose.model('Booking', bookingSchema);
