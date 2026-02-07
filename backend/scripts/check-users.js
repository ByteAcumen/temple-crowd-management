const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/temple_crowd_management';

async function checkUsers() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const User = mongoose.model('users', new mongoose.Schema({}, { strict: false }));
    const users = await User.find({ role: { $in: ['admin', 'gatekeeper'] } });

    console.log('Staff users found:');
    users.forEach(u => {
        console.log(`  - ${u.email} (${u.role}) - ID: ${u._id}`);
    });

    await mongoose.disconnect();
}

checkUsers().catch(console.error);
