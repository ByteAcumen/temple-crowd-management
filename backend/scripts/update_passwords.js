const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const User = require('../src/models/User');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/temple_db')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
        console.error('❌ DB Error:', err);
        process.exit(1);
    });

async function updatePasswords() {
    try {
        const salt = await bcrypt.genSalt(10);

        // Update Admin
        const adminPassword = await bcrypt.hash('Admin@123456', salt);
        const adminResult = await User.updateOne(
            { email: 'admin@temple.com' },
            { $set: { password: adminPassword } }
        );
        console.log(`✅ Admin password updated: ${adminResult.modifiedCount} record(s)`);

        // Update Gatekeeper
        const gatekeeperPassword = await bcrypt.hash('Gate@12345', salt);
        const gatekeeperResult = await User.updateOne(
            { email: 'gatekeeper@temple.com' },
            { $set: { password: gatekeeperPassword } }
        );
        console.log(`✅ Gatekeeper password updated: ${gatekeeperResult.modifiedCount} record(s)`);

        // Update Devotee
        const devoteePassword = await bcrypt.hash('User@12345', salt);
        const devoteeResult = await User.updateOne(
            { email: 'user@temple.com' },
            { $set: { password: devoteePassword } }
        );
        console.log(`✅ Devotee password updated: ${devoteeResult.modifiedCount} record(s)`);

        console.log('\n🎉 All passwords updated successfully!');
        console.log('-----------------------------------');
        console.log('Admin:      admin@temple.com / Admin@123456');
        console.log('Gatekeeper: gatekeeper@temple.com / Gate@12345');
        console.log('Devotee:    user@temple.com / User@12345');
        console.log('-----------------------------------');

        process.exit(0);
    } catch (err) {
        console.error('❌ Update Error:', err);
        process.exit(1);
    }
}

updatePasswords();
