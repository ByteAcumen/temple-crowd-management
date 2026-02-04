/**
 * SOCKET EVENT EMITTERS
 * 
 * Centralized WebSocket event broadcasting
 * Used by controllers to emit real-time updates
 */

class SocketEvents {
    constructor(io) {
        this.io = io;
    }

    /**
     * Broadcast crowd count update for a temple
     */
    emitCrowdUpdate(templeId, data) {
        this.io.to(`temple:${templeId}`).emit('crowd:update', {
            temple_id: templeId,
            current_count: data.current_count,
            capacity: data.capacity,
            percentage: data.percentage,
            status: data.status,
            timestamp: new Date()
        });

        // Also emit to admin dashboard
        this.io.to('admin:dashboard').emit('crowd:update', {
            temple_id: templeId,
            temple_name: data.temple_name,
            current_count: data.current_count,
            capacity: data.capacity,
            percentage: data.percentage,
            status: data.status,
            timestamp: new Date()
        });

        console.log(`📡 Crowd update broadcasted for temple: ${templeId}`);
    }

    /**
     * Broadcast threshold alert (85%, 95%)
     */
    emitThresholdAlert(templeId, alert) {
        this.io.to(`temple:${templeId}`).emit('threshold:alert', {
            temple_id: templeId,
            level: alert.level,
            message: alert.message,
            percentage: alert.percentage,
            action: alert.action,
            timestamp: new Date()
        });

        // Critical alerts to admin
        this.io.to('admin:dashboard').emit('threshold:alert', {
            temple_id: templeId,
            temple_name: alert.temple_name,
            level: alert.level,
            message: alert.message,
            percentage: alert.percentage,
            timestamp: new Date()
        });

        console.log(`🚨 Threshold alert broadcasted: ${alert.level} for temple ${templeId}`);
    }

    /**
     * Broadcast new booking created
     */
    emitBookingCreated(booking) {
        this.io.to('admin:dashboard').emit('booking:created', {
            booking_id: booking._id,
            temple_id: booking.temple,
            temple_name: booking.templeName,
            user_email: booking.userEmail,
            date: booking.date,
            slot: booking.slot,
            visitors: booking.visitors,
            timestamp: new Date()
        });

        console.log(`📝 New booking broadcasted: ${booking._id}`);
    }

    /**
     * Broadcast booking cancelled
     */
    emitBookingCancelled(booking) {
        this.io.to('admin:dashboard').emit('booking:cancelled', {
            booking_id: booking._id,
            temple_name: booking.templeName,
            user_email: booking.userEmail,
            timestamp: new Date()
        });

        console.log(`❌ Booking cancellation broadcasted: ${booking._id}`);
    }

    /**
     * Broadcast system stats update
     */
    emitStatsUpdate(stats) {
        this.io.to('admin:dashboard').emit('stats:update', {
            ...stats,
            timestamp: new Date()
        });

        console.log(`📊 Stats update broadcasted to admin dashboard`);
    }
}

module.exports = SocketEvents;
