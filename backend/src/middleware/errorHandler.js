const logger = require('../config/logger');

/**
 * Custom Application Error Class
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Async error wrapper to catch errors in async route handlers
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

/**
 * Handle specific error types
 */
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value: ${field} = "${value}". Please use another value.`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () =>
    new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
    new AppError('Your token has expired. Please log in again.', 401);

/**
 * Send error response in development
 */
const sendErrorDev = (err, req, res) => {
    logger.error('Error:', {
        error: err,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        user: req.user?.id,
    });

    res.status(err.statusCode).json({
        success: false,
        error: err.message,
        stack: err.stack,
        details: err,
    });
};

/**
 * Send error response in production
 */
const sendErrorProd = (err, req, res) => {
    // Log error details
    logger.error('Error:', {
        message: err.message,
        statusCode: err.statusCode,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        user: req.user?.id,
    });

    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            error: err.message,
        });
    }
    // Programming or unknown error: don't leak error details
    else {
        logger.error('CRITICAL ERROR:', err);

        res.status(500).json({
            success: false,
            error: 'Something went wrong. Please try again later.',
        });
    }
};

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else {
        let error = { ...err };
        error.message = err.message;

        // Handle specific error types
        if (err.name === 'CastError') error = handleCastErrorDB(err);
        if (err.code === 11000) error = handleDuplicateFieldsDB(err);
        if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
        if (err.name === 'JsonWebTokenError') error = handleJWTError();
        if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, req, res);
    }
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
    const err = new AppError(`Cannot ${req.method} ${req.originalUrl}`, 404);
    next(err);
};

module.exports = {
    AppError,
    catchAsync,
    errorHandler,
    notFound,
};
