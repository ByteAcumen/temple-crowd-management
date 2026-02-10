const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const resetPasswords = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/temple_db');
        console.log('✅ MongoDB Connected');

        const salt = await bcrypt.genSalt(10);

        // 1. Reset Gatekeeper
        const gatekeeperHash = await bcrypt.hash('gatekeeper123', salt);
        const resG = await mongoose.connection.db.collection('users').updateOne(
            { email: 'gatekeeper@temple.com' },
            { $set: { password: gatekeeperHash } }
        );
        console.log(`Gatekeeper Reset: ${resG.matchedCount > 0 ? 'SUCCESS' : 'NOT FOUND'}`);

        // 2. Reset Devotee (User 1)
        const userHash = await bcrypt.hash('password123', salt);
        const resU = await mongoose.connection.db.collection('users').updateOne(
            { email: 'user1@example.com' },
            { $set: { password: userHash } }
        );
        console.log(`Devotee (user1) Reset: ${resU.matchedCount > 0 ? 'SUCCESS' : 'NOT FOUND'}`);

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

resetPasswords();
