require('dotenv').config();
const mongoose = require('mongoose');
const redis = require('../src/config/redis'); // Use the existing Redis config
const Temple = require('../src/models/Temple');
const crowdTracker = require('../src/services/CrowdTracker');

// Parse command line arguments
const args = process.argv.slice(2);
const forceOpen = args.includes('--open');
const highTraffic = args.includes('--high');
const reset = args.includes('--reset');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/temple_db';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    }
};

const simulate = async () => {
    await connectDB();

    try {
        const temples = await Temple.find({});
        console.log(`Found ${temples.length} temples.`);

        if (temples.length === 0) {
            console.log('No temples found. Please seed the database first.');
            process.exit(0);
        }

        if (reset) {
            console.log('🔄 Resetting all counts to 0...');
            for (const temple of temples) {
                await crowdTracker.resetCount(temple._id.toString());
            }
            console.log('✅ All counts reset.');
            process.exit(0);
        }

        if (forceOpen) {
            console.log('🔓 Forcing all temples to OPEN status...');
            await Temple.updateMany({}, { status: 'OPEN' });
            console.log('✅ All temples set to OPEN.');
        }

        console.log('👥 Simulating crowd levels...');

        for (const temple of temples) {
            const totalCapacity = typeof temple.capacity === 'number' ? temple.capacity : (temple.capacity?.total || 1000);

            let targetPercentage;
            if (highTraffic) {
                // Generate 70% to 98% occupancy
                targetPercentage = 70 + Math.random() * 28;
            } else {
                // Generate 10% to 80% occupancy
                targetPercentage = 10 + Math.random() * 70;
            }

            const targetCount = Math.floor((targetPercentage / 100) * totalCapacity);

            // Direct update to Redis and MongoDB
            const countKey = `temple:${temple._id}:live_count`;
            await redis.set(countKey, targetCount);

            await Temple.findByIdAndUpdate(temple._id, {
                live_count: targetCount,
                updatedAt: new Date()
            });

            const status = targetPercentage >= 95 ? 'RED 🔴' : targetPercentage >= 85 ? 'ORANGE 🟠' : 'GREEN 🟢';
            console.log(`📍 ${temple.name}: ${targetCount}/${totalCapacity} (${targetPercentage.toFixed(1)}%) - ${status}`);
        }

        console.log('\n✅ Simulation complete!');
        console.log('Run the server and check the dashboard.');

    } catch (error) {
        console.error('❌ Simulation Error:', error);
    } finally {
        await mongoose.disconnect();
        // Redis connection might keep process alive, so we forcefully exit after a short delay to ensure logs flush
        setTimeout(() => process.exit(0), 1000);
    }
};

simulate();
