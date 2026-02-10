/**
 * Promote First Admin to Super Admin
 * Run: node scripts/promote-superadmin.js
 * 
 * This will find the first admin account and make it a Super Admin
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const promoteFirstAdmin = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/temple-epass';
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Find first admin
        const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });

        if (!admin) {
            console.log('❌ No admin account found. Create an admin first via /api/v1/admin/users');
            process.exit(1);
        }

        if (admin.isSuperAdmin) {
            console.log(`ℹ️  ${admin.email} is already a Super Admin`);
            process.exit(0);
        }

        // Promote to super admin
        admin.isSuperAdmin = true;
        await admin.save();

        console.log('🎉 Successfully promoted to Super Admin!');
        console.log(`   Name: ${admin.name}`);
        console.log(`   Email: ${admin.email}`);
        console.log('\n   You can now log in and manage temple admins.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

promoteFirstAdmin();
