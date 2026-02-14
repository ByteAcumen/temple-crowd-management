const { server } = require('./app');
const mongoose = require('mongoose');
const logger = require('./config/logger');
const templeStatusService = require('./services/TempleStatusService');
const crowdTracker = require('./services/CrowdTracker');

const PORT = process.env.PORT || 5000;

console.log('🚀 Server starting...');
console.log('📂 __filename:', __filename);
console.log('📂 CWD:', process.cwd());

// MongoDB Connection
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/temple_db';
        logger.info(`Connecting to MongoDB at ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}...`);
        await mongoose.connect(mongoUri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000
        });
        logger.info('MongoDB connected successfully');
    } catch (error) {
        logger.error('MongoDB connection error:', error.message);
        logger.error('Make sure MongoDB is running or set MONGO_URI in .env');
        process.exit(1);
    }
};

// Start Server
const startServer = async () => {
    await connectDB();

    // Start automated temple status scheduler (checks every 5 min)
    templeStatusService.startScheduler();
    logger.info('🕐 Temple Status Scheduler initialized');

    // Sync Redis from MongoDB (in case Redis was restarted)
    await crowdTracker.initializeAllCounts();

    server.listen(PORT, '0.0.0.0', () => {
        logger.info(`Server running on port ${PORT} `);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'} `);
        logger.info(`API: http://localhost:${PORT}/api/v1`);
    });
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('UNHANDLED REJECTION! Shutting down...', { reason, promise });
    server.close(() => {
        process.exit(1);
    });
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        mongoose.connection.close(false, () => {
            logger.info('MongoDB connection closed');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        mongoose.connection.close(false, () => {
            logger.info('MongoDB connection closed');
            process.exit(0);
        });
    });
});

startServer();
