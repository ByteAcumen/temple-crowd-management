/**
 * Gatekeeper Seeding Script
 * Creates gatekeeper user for Temple Smart E-Pass System
 * 
 * Usage: node scripts/seed-gatekeeper.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/temple_db';

// Import the actual User model to use its pre-save hook for password hashing
const User = require('../src/models/User');

// Default gatekeeper credentials
const GATEKEEPER_USER = {
    name: 'Temple Gatekeeper',
    email: 'gatekeeper@temple.com',
    password: 'Gate@12345',
    role: 'gatekeeper'
};

async function seedGatekeeper() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Delete existing gatekeeper if exists (to reset password)
        await User.deleteOne({ email: GATEKEEPER_USER.email });
        await User.deleteOne({ email: 'ci-gatekeeper@test.com' }); // Also delete old one

        console.log('🗑️  Cleared old gatekeeper accounts');

        // Create gatekeeper user - password will be hashed by User model's pre-save hook
        await User.create(GATEKEEPER_USER);

        console.log('✅ Gatekeeper user created successfully!');
        console.log('');
        console.log('   📧 Email:', GATEKEEPER_USER.email);
        console.log('   🔑 Password:', GATEKEEPER_USER.password);
        console.log('   👤 Role: gatekeeper');

        // Show all gatekeepers
        const gatekeepers = await User.find({ role: 'gatekeeper' }).select('name email role');
        console.log('');
        console.log('📋 Current gatekeeper users:');
        gatekeepers.forEach((g, i) => {
            console.log(`   ${i + 1}. ${g.name} (${g.email})`);
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
seedGatekeeper();

