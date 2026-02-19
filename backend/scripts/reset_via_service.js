require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Temple = require('../src/models/Temple');
const crowdTracker = require('../src/services/CrowdTracker');

const resetAll = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const temples = await Temple.find({});
        console.log(`Found ${temples.length} temples. Resetting counts...`);

        for (const temple of temples) {
            await crowdTracker.resetCount(temple._id.toString());
            console.log(`   - Reset ${temple.name}`);
        }

        console.log('🎉 SUCCESSFULLY RESET ALL TEMPLE COUNTS');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

resetAll();
