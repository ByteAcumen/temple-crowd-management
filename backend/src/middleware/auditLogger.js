/**
 * Audit Logger Middleware
 * Logs security-sensitive events for compliance and monitoring
 */

const logger = require('../config/logger');

// Security event types
const EVENTS = {
    AUTH_LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
    AUTH_LOGIN_FAILURE: 'AUTH_LOGIN_FAILURE',
    AUTH_REGISTER: 'AUTH_REGISTER',
    AUTH_LOGOUT: 'AUTH_LOGOUT',
    ACCESS_DENIED: 'ACCESS_DENIED',
    RATE_LIMIT_HIT: 'RATE_LIMIT_HIT',
    SENSITIVE_DATA_ACCESS: 'SENSITIVE_DATA_ACCESS',
};

/**
 * Log a security event
 * @param {string} event - Event type from EVENTS
 * @param {object} details - Event details (userId, email, ip, etc.)
 */
const logSecurityEvent = (event, details = {}) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        ...details,
        // Mark as security log for filtering
        category: 'SECURITY_AUDIT',
    };

    // Use winston logger for structured logging
    logger.info(JSON.stringify(logEntry));

    // Also console log in dev for visibility
    if (process.env.NODE_ENV !== 'production') {
        console.log(`🔐 [AUDIT] ${event}:`, details.email || details.userId || 'system');
    }
};

/**
 * Middleware to log request with user context
 */
const auditMiddleware = (req, res, next) => {
    // Store original end function
    const originalEnd = res.end;

    // Override end to capture response
    res.end = function (chunk, encoding) {
        // Log after response is sent
        if (res.statusCode >= 400) {
            logSecurityEvent('HTTP_ERROR', {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                ip: req.ip || req.connection.remoteAddress,
                userId: req.user?.id,
            });
        }
        originalEnd.call(this, chunk, encoding);
    };

    next();
};

/**
 * Log authentication attempt (call from authController)
 */
const logAuthAttempt = (success, email, ip, userId = null) => {
    logSecurityEvent(
        success ? EVENTS.AUTH_LOGIN_SUCCESS : EVENTS.AUTH_LOGIN_FAILURE,
        { email, ip, userId }
    );
};

/**
 * Log access denial (call from auth middleware)
 */
const logAccessDenied = (userId, role, attemptedRoute, ip) => {
    logSecurityEvent(EVENTS.ACCESS_DENIED, {
        userId,
        role,
        attemptedRoute,
        ip,
    });
};

module.exports = {
    EVENTS,
    logSecurityEvent,
    auditMiddleware,
    logAuthAttempt,
    logAccessDenied,
};
