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

    // OPERATING HOURS - Flexible timing system
    operatingHours: {
        // Regular weekday hours
        regular: {
            opens: { type: String, default: '06:00' },   // 24-hour format
            closes: { type: String, default: '21:00' }
        },
        // Weekend hours (if different)
        weekend: {
            opens: { type: String, default: '05:00' },
            closes: { type: String, default: '22:00' }
        },
        // Special dates with custom hours
        specialDays: [{
            date: Date,
            name: String,        // e.g., "Diwali", "Ram Navami"
            opens: String,
            closes: String,
            isClosed: { type: Boolean, default: false }
        }]
    },

    // FEE STRUCTURE
    fees: {
        general: { type: Number, default: 0 },           // Free entry
        specialDarshan: { type: Number, default: 300 },  // Skip the line
        vipEntry: { type: Number, default: 500 },        // Premium access
        foreigners: { type: Number, default: 0 },        // Foreign tourists
        prasad: { type: Number, default: 50 },           // Offering
        photography: { type: Number, default: 100 }      // Camera fee
    },

    // TEMPLE INFORMATION
    description: {
        type: String,
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },

    deity: {
        type: String,
        trim: true  // Main deity: "Lord Shiva", "Lord Vishnu", etc.
    },

    significance: {
        type: String,
        trim: true,
        maxlength: [1000, 'Significance cannot exceed 1000 characters']
    },

    // FACILITIES AVAILABLE
    facilities: {
        parking: { type: Boolean, default: true },
        wheelchairAccess: { type: Boolean, default: false },
        cloakroom: { type: Boolean, default: true },
        prasadCounter: { type: Boolean, default: true },
        shoeStand: { type: Boolean, default: true },
        drinkingWater: { type: Boolean, default: true },
        restrooms: { type: Boolean, default: true },
        accommodation: { type: Boolean, default: false },
        freeFood: { type: Boolean, default: false }       // Langar/Annadanam
    },

    // IMAGE URL (for gradients, we use temple name mapping in frontend)
    imageUrl: {
        type: String,
        trim: true
    },

    // GALLERY - Multiple temple images
    gallery: [{
        url: { type: String, required: true },
        caption: String,
        type: { type: String, enum: ['exterior', 'interior', 'deity', 'event', 'panorama'], default: 'exterior' },
        isPrimary: { type: Boolean, default: false }
    }],

    // PRASAD MENU - Different prasad options with prices
    prasadMenu: [{
        name: { type: String, required: true },    // "Laddu", "Tirupati Laddu", "Panchamrit"
        description: String,
        price: { type: Number, required: true },
        isAvailable: { type: Boolean, default: true },
        isVegetarian: { type: Boolean, default: true },
        servingSize: String,                        // "1 piece", "250g", "1 plate"
        specialOccasion: String                     // "Daily", "Festival only", "Weekends"
    }],

    // DONATION OPTIONS
    donations: {
        enabled: { type: Boolean, default: true },
        minimumAmount: { type: Number, default: 11 },
        options: [{
            name: String,                           // "General Donation", "Annadanam", "Temple Renovation"
            description: String,
            suggestedAmounts: [Number],             // [101, 501, 1001, 5001]
            purpose: String
        }],
        bankDetails: {
            accountName: String,
            accountNumber: String,
            ifscCode: String,
            bankName: String,
            upiId: String
        },
        taxExemption: { type: Boolean, default: true },
        section80G: { type: Boolean, default: true }
    },

    // SPECIAL SERVICES / SEVAS
    specialServices: [{
        name: { type: String, required: true },     // "Abhishekam", "Archana", "Homam"
        description: String,
        price: { type: Number, required: true },
        duration: String,                           // "30 mins", "1 hour"
        timings: [String],                          // ["06:00", "12:00", "18:00"]
        daysAvailable: [String],                    // ["Monday", "Friday", "AllDays"]
        maxParticipants: { type: Number, default: 1 },
        requiresBooking: { type: Boolean, default: true },
        advanceBookingDays: { type: Number, default: 7 }
    }],

    // ANNUAL EVENTS / FESTIVALS
    annualEvents: [{
        name: { type: String, required: true },     // "Maha Shivaratri", "Brahmotsavam"
        description: String,
        startDate: String,                          // "February" or specific date
        endDate: String,
        duration: String,                           // "1 day", "9 days"
        expectedCrowd: { type: String, enum: ['low', 'medium', 'high', 'extreme'] },
        specialActivities: [String]
    }],

    // TEMPLE HISTORY
    history: {
        foundedYear: String,                        // "800 AD", "1801"
        founder: String,
        architecturalStyle: String,                 // "Dravidian", "Nagara", "Vesara"
        historicalEvents: [String],
        renovations: [{
            year: String,
            description: String
        }]
    },

    // RULES & GUIDELINES
    rules: {
        dressCode: {
            men: String,                            // "Traditional dhoti or formal wear"
            women: String                           // "Saree or salwar kameez"
        },
        restrictions: [String],                     // ["No leather items", "No mobiles"]
        photography: {
            allowed: { type: Boolean, default: false },
            restrictions: String                    // "Only in outer areas"
        },
        timingsNote: String                         // "Temple closes during afternoon"
    },

    // NEARBY ATTRACTIONS
    nearbyAttractions: [{
        name: String,
        type: { type: String, enum: ['temple', 'monument', 'nature', 'market', 'restaurant'] },
        distance: String,                           // "2 km", "500 m"
        description: String
    }],

    // HOW TO REACH
    howToReach: {
        nearestAirport: { name: String, distance: String },
        nearestRailway: { name: String, distance: String },
        nearestBusStop: { name: String, distance: String },
        localTransport: [String]                    // ["Auto", "Bus", "Taxi"]
    },

    // SOCIAL MEDIA & ONLINE PRESENCE
    socialMedia: {
        facebook: String,
        instagram: String,
        twitter: String,
        youtube: String
    },

    // LIVE DARSHAN / STREAMING
    liveDarshan: {
        enabled: { type: Boolean, default: false },
        streamUrl: String,
        timings: [String]
    },

    // ACCOMMODATION OPTIONS
    accommodationDetails: [{
        name: String,                               // "Temple Guest House", "Dharamshala"
        type: { type: String, enum: ['guest_house', 'dharamshala', 'hotel', 'cottage'] },
        priceRange: { min: Number, max: Number },
        contact: String,
        amenities: [String]
    }],

    // RATINGS & REVIEWS (for future)
    ratings: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        count: { type: Number, default: 0 }
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
