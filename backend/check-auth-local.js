const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://localhost:27017/temple_db';

async function checkAuth() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const email = 'admin@temple.com';
        const password = 'Admin@123456';

        const user = await User.findOne({ email }).select('+password');

        const allUsers = await User.find({});
        console.log(`Total users in DB: ${allUsers.length}`);
        allUsers.forEach(u => console.log(` - ${u.email}`));

        if (!user) {
            console.log('Target Admin User not found!');
            return;
        }

        console.log('User found:', user.email);
        console.log('Stored Hash:', user.password);

        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password Match Result:', isMatch);

        if (isMatch) {
            console.log('✅ Local auth verification PASSED');
        } else {
            console.log('❌ Local auth verification FAILED');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkAuth();
