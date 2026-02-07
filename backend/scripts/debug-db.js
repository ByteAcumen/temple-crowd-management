const mongoose = require('mongoose');
require('dotenv').config();

// Fix: Connect to the Docker Mongo instance directly if running on host
// Host port 27017 -> Container port 27017
const MONGO_URI = 'mongodb://localhost:27017/temple_db'; // Use explicit DB name 'temple_db'

async function checkUsers() {
    try {
        console.log('🔌 Connecting to MongoDB at', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected');

        // Use the actual schema to check data integrity
        const User = require('../src/models/User');

        const users = await User.find({}).select('+password');
        console.log(`Found ${users.length} users:`);

        for (const u of users) {
            console.log(`- ${u.email} (${u.role})`);
            console.log(`  Hash starts with: ${u.password ? u.password.substring(0, 10) + '...' : 'NO PASSWORD'}`);
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkUsers();
