const Redis = require('ioredis');

// Smart Redis host detection:
// - In Docker: use service name 'redis'
// - Local development: use 'localhost'
// - Can be overridden with REDIS_HOST env var
const REDIS_HOST = process.env.REDIS_HOST || (process.env.NODE_ENV === 'production' ? 'redis' : 'localhost');
const REDIS_PORT = process.env.REDIS_PORT || 6379;

console.log(`🔌 Connecting to Redis at ${REDIS_HOST}:${REDIS_PORT}...`);

const redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    retryStrategy(times) {
        if (times > 10) return null;
        return Math.min(times * 100, 2000);
    }
});

redis.on('connect', () => {
    console.log('✅ Redis Connected Successfully');
});

redis.on('error', (err) => {
    console.error('❌ Redis Connection Error:', err);
});

module.exports = redis;
