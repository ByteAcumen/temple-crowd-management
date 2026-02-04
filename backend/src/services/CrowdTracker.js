const redis = require('../config/redis');
const Temple = require('../models/Temple');

/**
 * CrowdTracker Service
 * 
 * WHY THIS SERVICE EXISTS:
 * - We need REAL-TIME crowd counting (Redis is 100x faster than MongoDB)
 * - Gatekeepers scan QR codes to record entry/exit
 * - System must track current people inside each temple
 * - Auto-alert when capacity thresholds reached (85% warning, 95% critical)
 * 
 * REDIS KEY STRUCTURE:
 * - temple:{templeId}:live_count → Current number of people inside
 * - temple:{templeId}:entries → Set of booking IDs currently inside
 * 
 * WORKFLOW:
 * 1. Gatekeeper scans entry QR → recordEntry() → Redis INCR
 * 2. Person leaves → Gatekeeper scans exit QR → recordExit() → Redis DECR
 * 3. Dashboard fetches → getCurrentCount() → Redis GET (super fast!)
 * 4. System checks → checkThresholds() → Send alerts if needed
 */

class CrowdTracker {
    /**
     * Record Temple Entry
     * Called when gatekeeper scans QR code for entry
     * 
     * @param {String} templeId - MongoDB Temple ID
     * @param {String} bookingId - Booking/Pass ID
     * @returns {Object} { count, percentage, status }
     */
    async recordEntry(templeId, bookingId) {
        try {
            const countKey = `temple:${templeId}:live_count`;
            const entriesKey = `temple:${templeId}:entries`;

            // Check if already inside (prevent duplicate entry)
            const alreadyInside = await redis.sismember(entriesKey, bookingId);
            if (alreadyInside) {
                return {
                    success: false,
                    error: 'This pass has already been used for entry'
                };
            }

            // Increment count atomically (thread-safe)
            const newCount = await redis.incr(countKey);

            // Add to entries set
            await redis.sadd(entriesKey, bookingId);

            // Update MongoDB for persistence
            await Temple.findByIdAndUpdate(templeId, {
                live_count: newCount,
                updatedAt: Date.now()
            });

            // Check capacity thresholds
            const thresholdCheck = await this.checkThresholds(templeId, newCount);

            return {
                success: true,
                live_count: newCount,
                percentage: thresholdCheck.percentage,
                status: thresholdCheck.status,
                alert: thresholdCheck.alert
            };

        } catch (error) {
            console.error('❌ Error recording entry:', error);
            throw error;
        }
    }

    /**
     * Record Temple Exit
     * Called when person leaves temple
     * 
     * @param {String} templeId - MongoDB Temple ID
     * @param {String} bookingId - Booking/Pass ID
     * @returns {Object} { count, percentage, status }
     */
    async recordExit(templeId, bookingId) {
        try {
            const countKey = `temple:${templeId}:live_count`;
            const entriesKey = `temple:${templeId}:entries`;

            // Check if actually inside
            const isInside = await redis.sismember(entriesKey, bookingId);
            if (!isInside) {
                return {
                    success: false,
                    error: 'This pass was not used for entry'
                };
            }

            // Decrement count atomically
            const newCount = await redis.decr(countKey);

            // Remove from entries set
            await redis.srem(entriesKey, bookingId);

            // Never allow negative count
            const safeCount = Math.max(0, newCount);
            if (safeCount === 0 && newCount < 0) {
                await redis.set(countKey, 0);
            }

            // Update MongoDB
            await Temple.findByIdAndUpdate(templeId, {
                live_count: safeCount,
                updatedAt: Date.now()
            });

            // Check if we've dropped below thresholds
            const thresholdCheck = await this.checkThresholds(templeId, safeCount);

            return {
                success: true,
                live_count: safeCount,
                percentage: thresholdCheck.percentage,
                status: thresholdCheck.status
            };

        } catch (error) {
            console.error('❌ Error recording exit:', error);
            throw error;
        }
    }

    /**
     * Get Current Live Count
     * Super fast Redis read for dashboard
     * 
     * @param {String} templeId - MongoDB Temple ID
     * @returns {Number} Current people count
     */
    async getCurrentCount(templeId) {
        try {
            const countKey = `temple:${templeId}:live_count`;
            const count = await redis.get(countKey);
            return parseInt(count) || 0;
        } catch (error) {
            console.error('❌ Error getting count:', error);
            return 0;
        }
    }

    /**
     * Check Capacity Thresholds
     * Determines traffic light status and triggers alerts
     * 
     * @param {String} templeId - MongoDB Temple ID  
     * @param {Number} currentCount - Current people count
     * @returns {Object} { percentage, status, alert }
     */
    async checkThresholds(templeId, currentCount) {
        try {
            const temple = await Temple.findById(templeId);

            if (!temple) {
                return { percentage: 0, status: 'UNKNOWN', alert: null };
            }

            const percentage = (currentCount / temple.capacity.total) * 100;
            let status = 'GREEN';
            let alert = null;

            // CRITICAL: 95%+ capacity (RED - STOP NEW ENTRIES!)
            if (percentage >= temple.capacity.threshold_critical) {
                status = 'RED';
                alert = {
                    level: 'CRITICAL',
                    message: `🚨 CRITICAL: ${temple.name} at ${percentage.toFixed(1)}% capacity!`,
                    action: 'BLOCK_NEW_ENTRIES'
                };

                // Log critical alert
                console.log(`🚨 CRITICAL ALERT: Temple ${templeId} at ${percentage.toFixed(1)}%`);

                // TODO: Send SMS/Email/Push notifications
                // await this.sendNotification(templeId, alert);
            }
            // WARNING: 85-94% capacity (ORANGE - WARN ADMINS)
            else if (percentage >= temple.capacity.threshold_warning) {
                status = 'ORANGE';
                alert = {
                    level: 'WARNING',
                    message: `⚠️  WARNING: ${temple.name} at ${percentage.toFixed(1)}% capacity`,
                    action: 'NOTIFY_ADMINS'
                };

                console.log(`⚠️  WARNING: Temple ${templeId} at ${percentage.toFixed(1)}%`);
            }
            // NORMAL: <85% capacity (GREEN - SAFE)
            else {
                status = 'GREEN';
            }

            return {
                percentage: parseFloat(percentage.toFixed(1)),
                status,
                alert
            };

        } catch (error) {
            console.error('❌ Error checking thresholds:', error);
            return { percentage: 0, status: 'ERROR', alert: null };
        }
    }

    /**
     * Initialize Live Count from MongoDB
     * Run this on server startup to sync Redis with DB
     * 
     * @param {String} templeId - MongoDB Temple ID
     */
    async initializeCount(templeId) {
        try {
            const temple = await Temple.findById(templeId);
            if (temple) {
                const countKey = `temple:${templeId}:live_count`;
                await redis.set(countKey, temple.live_count || 0);
                console.log(`✅ Initialized count for ${temple.name}: ${temple.live_count}`);
            }
        } catch (error) {
            console.error('❌ Error initializing count:', error);
        }
    }

    /**
     * Get All People Currently Inside
     * Returns list of booking IDs
     * 
     * @param {String} templeId - MongoDB Temple ID
     * @returns {Array} Array of booking IDs
     */
    async getCurrentEntries(templeId) {
        try {
            const entriesKey = `temple:${templeId}:entries`;
            return await redis.smembers(entriesKey);
        } catch (error) {
            console.error('❌ Error getting entries:', error);
            return [];
        }
    }

    /**
     * Reset Count to Zero
     * Admin operation for emergencies or end of day
     * 
     * @param {String} templeId - MongoDB Temple ID
     */
    async resetCount(templeId) {
        try {
            const countKey = `temple:${templeId}:live_count`;
            const entriesKey = `temple:${templeId}:entries`;

            await redis.set(countKey, 0);
            await redis.del(entriesKey);

            await Temple.findByIdAndUpdate(templeId, {
                live_count: 0,
                updatedAt: Date.now()
            });

            console.log(`🔄 Reset count for temple ${templeId}`);
            return { success: true, message: 'Count reset to 0' };
        } catch (error) {
            console.error('❌ Error resetting count:', error);
            throw error;
        }
    }
}

// Export singleton instance
module.exports = new CrowdTracker();
