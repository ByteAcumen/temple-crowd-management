const Temple = require('../models/Temple');

/**
 * TempleStatusService - Automated Temple Management
 * 
 * This service handles:
 * 1. Automatic OPEN/CLOSED status based on operating hours
 * 2. Traffic prediction based on historical patterns
 * 3. Special event crowd estimation
 * 4. Real-time status updates
 * 
 * Runs as a cron job every 5 minutes or can be called manually
 */

class TempleStatusService {
    constructor() {
        this.UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
        this.dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    }

    /**
     * Get current time in HH:MM format
     */
    getCurrentTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    /**
     * Check if current time is within operating hours
     * @param {Object} operatingHours - Temple operating hours config
     * @returns {Boolean} - Whether temple should be open
     */
    isWithinOperatingHours(operatingHours) {
        if (!operatingHours) return true; // Default to open if no hours set

        const now = new Date();
        const currentDay = this.dayNames[now.getDay()];
        const currentTime = this.getCurrentTime();

        // Check for regular/weekend hours
        const isWeekend = currentDay === 'saturday' || currentDay === 'sunday';

        let opens, closes;

        if (isWeekend && operatingHours.weekend) {
            opens = operatingHours.weekend.opens || '05:00';
            closes = operatingHours.weekend.closes || '22:00';
        } else if (operatingHours.regular) {
            opens = operatingHours.regular.opens || '06:00';
            closes = operatingHours.regular.closes || '21:00';
        } else {
            // Legacy format support
            opens = operatingHours.open || operatingHours.opens || '06:00';
            closes = operatingHours.close || operatingHours.closes || '21:00';
        }

        // Handle overnight temples (opens late, closes early morning)
        if (opens > closes) {
            return currentTime >= opens || currentTime <= closes;
        }

        return currentTime >= opens && currentTime <= closes;
    }

    /**
     * Predict crowd level based on day and time
     * Uses simple heuristics that can be replaced with ML model
     * @param {Date} dateTime - Time to predict for
     * @returns {String} - Predicted crowd level: LOW, MODERATE, HIGH, VERY_HIGH
     */
    predictCrowdLevel(dateTime = new Date()) {
        const day = dateTime.getDay();
        const hour = dateTime.getHours();
        const isWeekend = day === 0 || day === 6;

        // Festival/Special days (can be expanded with calendar integration)
        /* const month = now.toLocaleString('default', { month: 'short' });
        const date = now.getDate(); */

        // Peak hours: Morning prayer (5-8 AM), Evening aarti (5-8 PM)
        const isMorningPeak = hour >= 5 && hour <= 8;
        const isEveningPeak = hour >= 17 && hour <= 20;

        // Saturday/Sunday typically higher footfall
        if (isWeekend) {
            if (isMorningPeak || isEveningPeak) return 'VERY_HIGH';
            if (hour >= 9 && hour <= 16) return 'HIGH';
            return 'MODERATE';
        }

        // Weekday patterns
        if (isMorningPeak || isEveningPeak) return 'HIGH';
        if (hour >= 9 && hour <= 16) return 'MODERATE';
        return 'LOW';
    }

    /**
     * Get estimated wait time in minutes based on crowd prediction
     * @param {String} crowdLevel - Crowd level
     * @returns {Number} - Estimated wait time in minutes
     */
    getEstimatedWaitTime(crowdLevel) {
        const waitTimes = {
            'LOW': 5,
            'MODERATE': 15,
            'HIGH': 30,
            'VERY_HIGH': 60
        };
        return waitTimes[crowdLevel] || 15;
    }

    /**
     * Update single temple status based on operating hours
     * @param {Object} temple - Temple document
     * @returns {Object} - Updated status info
     */
    async updateTempleStatus(temple) {
        try {
            // FORCE_TEMPLES_OPEN=true for dev/demo - always show temples as open
            const forceOpen = process.env.FORCE_TEMPLES_OPEN === 'true' || process.env.FORCE_TEMPLES_OPEN === '1';
            const shouldBeOpen = forceOpen || this.isWithinOperatingHours(temple.operatingHours);
            const currentStatus = temple.status;
            const newStatus = shouldBeOpen ? 'OPEN' : 'CLOSED';

            // Only update if status changed
            if (currentStatus !== newStatus) {
                await Temple.findByIdAndUpdate(temple._id, {
                    status: newStatus,
                    lastStatusUpdate: new Date()
                });

                console.log(`🔄 ${temple.name}: ${currentStatus} → ${newStatus}`);
                return { updated: true, from: currentStatus, to: newStatus };
            }

            return { updated: false, status: currentStatus };
        } catch (error) {
            console.error(`Error updating ${temple.name}:`, error.message);
            return { error: error.message };
        }
    }

    /**
     * Update all temples status based on operating hours
     * Called by cron job every 5 minutes
     */
    async updateAllTemplesStatus() {
        try {
            const temples = await Temple.find({});
            console.log(`\n⏰ [${new Date().toLocaleTimeString()}] Running temple status check...`);

            const results = {
                total: temples.length,
                opened: 0,
                closed: 0,
                unchanged: 0,
                errors: 0
            };

            for (const temple of temples) {
                const result = await this.updateTempleStatus(temple);

                if (result.error) {
                    results.errors++;
                } else if (result.updated) {
                    result.to === 'OPEN' ? results.opened++ : results.closed++;
                } else {
                    results.unchanged++;
                }
            }

            console.log(`📊 Status: ${results.opened} opened, ${results.closed} closed, ${results.unchanged} unchanged`);
            return results;
        } catch (error) {
            console.error('Error in updateAllTemplesStatus:', error);
            throw error;
        }
    }

    /**
     * Get temple predictions for dashboard
     * @param {String} templeId - Temple ID
     * @returns {Object} - Predictions and recommendations
     */
    async getTemplePredictions(templeId) {
        try {
            const temple = await Temple.findById(templeId);
            if (!temple) throw new Error('Temple not found');

            const now = new Date();
            const crowdLevel = this.predictCrowdLevel(now);
            const waitTime = this.getEstimatedWaitTime(crowdLevel);

            // Predict next few hours
            const hourlyPredictions = [];
            for (let i = 1; i <= 6; i++) {
                const futureTime = new Date(now.getTime() + i * 60 * 60 * 1000);
                hourlyPredictions.push({
                    time: futureTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                    crowdLevel: this.predictCrowdLevel(futureTime),
                    estimatedWait: this.getEstimatedWaitTime(this.predictCrowdLevel(futureTime))
                });
            }

            // Best time to visit recommendation
            const bestTimeToVisit = hourlyPredictions
                .filter(p => p.crowdLevel === 'LOW' || p.crowdLevel === 'MODERATE')
                .map(p => p.time)
                .slice(0, 2);

            return {
                temple: temple.name,
                currentTime: now.toLocaleTimeString(),
                isOpen: temple.status === 'OPEN',
                currentCrowdLevel: crowdLevel,
                estimatedWaitMinutes: waitTime,
                hourlyPredictions,
                bestTimeToVisit: bestTimeToVisit.length > 0 ? bestTimeToVisit : ['Early morning (5-6 AM)'],
                recommendation: crowdLevel === 'VERY_HIGH'
                    ? 'Consider visiting during off-peak hours for shorter wait'
                    : crowdLevel === 'HIGH'
                        ? 'Moderate crowd expected, book special darshan for faster entry'
                        : 'Good time to visit!'
            };
        } catch (error) {
            console.error('Error getting predictions:', error);
            throw error;
        }
    }

    /**
     * Start the automated status update scheduler
     * Sets up interval to check and update temple statuses
     */
    startScheduler() {
        console.log('🚀 Temple Status Scheduler started');

        const runUpdate = () => {
            this.updateAllTemplesStatus().catch(err =>
                console.error('Temple status update failed:', err.message)
            );
        };

        runUpdate();
        setInterval(runUpdate, this.UPDATE_INTERVAL);
    }
}

// Export singleton instance
module.exports = new TempleStatusService();
