/**
 * Temple Seeding Script
 * Creates initial temple data for Temple Smart E-Pass System
 * 
 * Usage: node scripts/seed-temple.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/temple_db';

// Temple Schema (simplified for seeding)
const templeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: {
        city: { type: String, required: true },
        state: { type: String, required: true }
    },
    description: String,
    images: [String],
    openingHours: {
        open: { type: String, default: '06:00' },
        close: { type: String, default: '22:00' }
    },
    capacity: {
        total: { type: Number, default: 1000 },
        batchSize: { type: Number, default: 100 },
        slotDuration: { type: Number, default: 60 } // minutes
    },
    status: { type: String, enum: ['OPEN', 'CLOSED', 'MAINTENANCE'], default: 'OPEN' }
}, { timestamps: true });

const Temple = mongoose.model('Temple', templeSchema);

const TEMPLES = [
    {
        name: 'Shree Siddhivinayak Ganapati Temple',
        location: {
            city: 'Mumbai',
            state: 'Maharashtra'
        },
        description: 'One of the richest and most famous temples represents the Elephant God, the entry to which is strictly managed.',
        images: ['/temples/siddhivinayak.jpg'],
        capacity: {
            total: 5000,
            batchSize: 200,
            slotDuration: 30
        }
    },
    {
        name: 'Kashi Vishwanath Temple',
        location: {
            city: 'Varanasi',
            state: 'Uttar Pradesh'
        },
        description: 'One of the most famous Hindu temples dedicated to Lord Shiva.',
        images: ['/temples/kashi.jpg'],
        capacity: {
            total: 3000,
            batchSize: 150,
            slotDuration: 45
        }
    }
];

async function seedTemples() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing temples
        await Temple.deleteMany({});
        console.log('🗑️  Cleared old temple data');

        // Create new temples
        const createdTemples = await Temple.create(TEMPLES);

        console.log(`✅ Successfully created ${createdTemples.length} temples!`);
        console.log('');
        console.log('📋 TEMPLE LIST:');
        createdTemples.forEach((t, i) => {
            console.log(`   ${i + 1}. ${t.name} (${t.location.city}, ${t.location.state})`);
            console.log(`      ID: ${t._id}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('');
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the script
seedTemples();
