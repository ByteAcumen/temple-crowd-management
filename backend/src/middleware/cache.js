/**
 * RESPONSE CACHE MIDDLEWARE
 * 
 * Simple in-memory cache for frequently accessed endpoints.
 * Dramatically improves response times for repeated requests.
 * 
 * Usage:
 *   router.get('/temples', cache(30), getAllTemples);
 *   // Caches response for 30 seconds
 */

// Simple in-memory cache store
const cacheStore = new Map();

/**
 * Create cache middleware with configurable TTL
 * @param {number} ttlSeconds - Time to live in seconds (default: 30)
 * @returns {Function} Express middleware
 */
const cache = (ttlSeconds = 30) => {
    return (req, res, next) => {
        // Skip caching for non-GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Skip if user is authenticated (may need personalized data)
        if (req.user) {
            return next();
        }

        // Generate cache key from URL + query params
        const cacheKey = `${req.originalUrl || req.url}`;

        // Check if we have a valid cached response
        const cached = cacheStore.get(cacheKey);
        if (cached && cached.expiry > Date.now()) {
            // Return cached response
            res.set('X-Cache', 'HIT');
            res.set('X-Cache-TTL', Math.round((cached.expiry - Date.now()) / 1000));
            return res.status(cached.status).json(cached.data);
        }

        // Store original json method
        const originalJson = res.json.bind(res);

        // Override json to cache the response
        res.json = (data) => {
            // Only cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 400) {
                cacheStore.set(cacheKey, {
                    data,
                    status: res.statusCode,
                    expiry: Date.now() + (ttlSeconds * 1000)
                });
            }
            res.set('X-Cache', 'MISS');
            return originalJson(data);
        };

        next();
    };
};

/**
 * Clear specific cache entry or all entries
 * @param {string} pattern - Optional URL pattern to clear
 */
const clearCache = (pattern = null) => {
    if (pattern) {
        for (const key of cacheStore.keys()) {
            if (key.includes(pattern)) {
                cacheStore.delete(key);
            }
        }
    } else {
        cacheStore.clear();
    }
};

/**
 * Get cache stats
 */
const getCacheStats = () => {
    let validEntries = 0;
    const now = Date.now();

    for (const cached of cacheStore.values()) {
        if (cached.expiry > now) {
            validEntries++;
        }
    }

    return {
        totalEntries: cacheStore.size,
        validEntries,
        expiredEntries: cacheStore.size - validEntries
    };
};

// Cleanup expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cacheStore.entries()) {
        if (value.expiry <= now) {
            cacheStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

module.exports = { cache, clearCache, getCacheStats };
