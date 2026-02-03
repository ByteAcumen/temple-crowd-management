const mongoose = require('mongoose');

/**
 * Temple Schema
 * 
 * WHY THIS MODEL EXISTS:
 * - Temples are the core entities we're managing
 * - We need to track: location, capacity limits, time slots, live crowd count
 * - This allows admins to add/edit temples and users to see available temples
 * 
 * KEY FEATURES:
 * 1. Capacity Management - Know when temple is reaching capacity
 * 2. Slot Management - Divide day into time slots (e.g., 9-10AM, 10-11AM)
 * 3. Live Count Tracking - How many people are inside right now
 * 4. Threshold Alerts - Warn at 85%, Critical at 95%
 */

const templeSchema = new mongoose.Schema({
    // BASIC INFO
    name: {
        type: String,
        required: [true, 'Temple name is required'],
        unique: true,  // Each temple name must be unique
        trim: true     // Remove extra spaces
    },

    // LOCATION DETAILS
    location: {
        address: { type: String, trim: true },
        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true
        },
        state: { type: String, trim: true },
        // GPS coordinates for map features (future)
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },

    // CAPACITY MANAGEMENT (CRITICAL FOR CROWD CONTROL!)
    capacity: {
        // Total people allowed at once (e.g., 10,000)
        total: {
            type: Number,
            required: [true, 'Total capacity is required'],
            min: [50, 'Capacity must be at least 50']
        },

        // Max people per time slot (e.g., 500 per hour)
        per_slot: {
            type: Number,
            default: 500,
            min: [10, 'Slot capacity too small']
        },

        // When to send WARNING alert (85% = warning)
        threshold_warning: {
            type: Number,
            default: 85,
            min: 0,
            max: 100
        },

        // When to send CRITICAL alert (95% = critical, stop new entries)
        threshold_critical: {
            type: Number,
            default: 95,
            min: 0,
            max: 100
        }
    },

    // TIME SLOTS - Divide the day into manageable chunks
    // Example: [{time: "09:00 AM - 10:00 AM", max_capacity: 500}]
    slots: [{
        time: {
            type: String,
            required: true
        },
        max_capacity: {
            type: Number,
            default: function () { return this.parent().capacity.per_slot; }
        },
        is_active: {
            type: Boolean,
            default: true  // Can disable slots temporarily
        }
    }],

    // CONTACT INFORMATION
    contact: {
        phone: { type: String, trim: true },
        email: {
            type: String,
            lowercase: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
        },
        website: { type: String, trim: true }
    },

    // LIVE TRACKING (MOST IMPORTANT!)
    // Number of people currently inside the temple RIGHT NOW
    // Updated by Redis (super fast) and synced here for persistence
    live_count: {
        type: Number,
        default: 0,
        min: 0  // Never negative
    },

    // OPERATIONAL STATUS
    status: {
        type: String,
        enum: {
            values: ['OPEN', 'CLOSED', 'MAINTENANCE'],
            message: '{VALUE} is not a valid status'
        },
        default: 'OPEN'
    },

    // TIMESTAMPS (automatically managed)
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    // Enable automatic timestamp management
    timestamps: true,
    // Include virtuals in JSON output
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// INDEXES FOR PERFORMANCE
// Note: name field already has index from unique:true
// Search temples by city (e.g., "Show all temples in Ahmedabad")
templeSchema.index({ 'location.city': 1 });
// Search temples by status (e.g., "Show only OPEN temples")  
templeSchema.index({ status: 1 });

// VIRTUAL PROPERTY: Calculate current capacity percentage
// This is NOT stored in database, calculated on-the-fly
templeSchema.virtual('capacity_percentage').get(function () {
    if (!this.capacity.total) return 0;
    return ((this.live_count / this.capacity.total) * 100).toFixed(1);
});

// VIRTUAL PROPERTY: Get traffic light status (GREEN/ORANGE/RED)
templeSchema.virtual('traffic_status').get(function () {
    const percentage = parseFloat(this.capacity_percentage);

    if (percentage >= this.capacity.threshold_critical) {
        return 'RED';    // CRITICAL - Don't allow more people
    } else if (percentage >= this.capacity.threshold_warning) {
        return 'ORANGE'; // WARNING - Approaching capacity
    } else {
        return 'GREEN';  // NORMAL - Safe to enter
    }
});

// MIDDLEWARE: Update 'updatedAt' timestamp before saving
templeSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// MIDDLEWARE: Update 'updatedAt' on findOneAndUpdate
templeSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updatedAt: Date.now() });
    next();
});

/**
 * EXPORT THE MODEL
 * 
 * USAGE EXAMPLES:
 * 
 * 1. Create a temple:
 *    const temple = await Temple.create({
 *      name: "Somnath Temple",
 *      location: { city: "Veraval", state: "Gujarat" },
 *      capacity: { total: 10000, per_slot: 500 }
 *    });
 * 
 * 2. Find all temples:
 *    const temples = await Temple.find({ status: 'OPEN' });
 * 
 * 3. Get one temple:
 *    const temple = await Temple.findById(templeId);
 * 
 * 4. Update live count:
 *    await Temple.findByIdAndUpdate(templeId, { live_count: 1500 });
 * 
 * 5. Check traffic status:
 *    console.log(temple.traffic_status); // "GREEN" or "ORANGE" or "RED"
 */

module.exports = mongoose.model('Temple', templeSchema);
