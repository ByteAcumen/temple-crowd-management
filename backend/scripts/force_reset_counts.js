require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const redis = require('redis');
const Temple = require('../src/models/Temple');

// Redis Client Setup
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

const resetData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        await redisClient.connect();
        console.log('✅ Connected to Redis');

        // 1. Reset MongoDB
        const result = await Temple.updateMany({}, {
            $set: { live_count: 0 }
        });
        console.log(`✅ MongoDB: Reset live_count for ${result.modifiedCount} temples`);

        // 2. Reset Redis
        const temples = await Temple.find({});
        for (const temple of temples) {
            const key = `temple:${temple._id}:live_count`;
            await redisClient.set(key, '0');
            console.log(`   - Reset Redis key: ${key}`);
        }

        console.log('🎉 SUCCESSFULLY RESET ALL CROWD DATA');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

resetData();
