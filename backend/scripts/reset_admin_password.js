const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/temple_db');
        console.log('✅ MongoDB Connected');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const res = await mongoose.connection.db.collection('users').updateOne(
            { email: 'admin@temple.com' },
            { $set: { password: hashedPassword } }
        );

        if (res.matchedCount > 0) {
            console.log('✅ Admin password reset to: admin123');
        } else {
            console.log('❌ Admin user not found');
        }
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

resetPassword();
