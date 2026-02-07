/**
 * Admin Seeding Script
 * Creates initial admin user for Temple Smart E-Pass System
 * 
 * Usage: node scripts/seed-admin.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/temple_db';

// Import the actual User model to use its pre-save hook for password hashing
const User = require('../src/models/User');

// Default admin credentials (CHANGE IN PRODUCTION!)
const ADMIN_USER = {
    name: process.env.ADMIN_NAME || 'System Administrator',
    email: process.env.ADMIN_EMAIL || 'admin@temple.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123456',
    role: 'admin'
};

async function seedAdmin() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Delete existing admin if exists (to reset password)
        await User.deleteOne({ email: ADMIN_USER.email });
        console.log('🗑️  Cleared old admin account if existed');

        // Create admin user - password will be hashed by User model's pre-save hook
        await User.create(ADMIN_USER);

        console.log('✅ Admin user created successfully!');
        console.log('');
        console.log('   📧 Email:', ADMIN_USER.email);
        console.log('   🔑 Password:', ADMIN_USER.password);
        console.log('   👤 Role: admin');
        console.log('');
        console.log('⚠️  IMPORTANT: Change this password immediately in production!');

        // Show all admin users
        const admins = await User.find({ role: 'admin' }).select('name email role');
        console.log('');
        console.log('📋 Current admin users:');
        admins.forEach((a, i) => {
            console.log(`   ${i + 1}. ${a.name} (${a.email})`);
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
seedAdmin();

