const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config({ path: './.env' });

const User = require('../src/models/User');

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/temple_db');
        console.log('✅ Connected to MongoDB');

        const email = 'test123@gmail.com';
        const newPassword = 'Temple@123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const user = await User.findOneAndUpdate(
            { email: email },
            { password: hashedPassword },
            { new: true }
        );

        if (user) {
            console.log(`✅ Password updated for ${email}`);
            console.log(`🔑 New Password: ${newPassword}`);
        } else {
            console.log(`❌ User ${email} not found`);
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetPassword();
