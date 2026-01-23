const Redis = require('ioredis');

// Using service name 'redis' from docker-compose, internal port 6379
// Host machine uses 6380, but container-to-container uses 6379
const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

console.log(`🔌 Connecting to Redis at ${REDIS_HOST}:${REDIS_PORT}...`);

const redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

redis.on('connect', () => {
    console.log('✅ Redis Connected Successfully');
});

redis.on('error', (err) => {
    console.error('❌ Redis Connection Error:', err);
});

module.exports = redis;
