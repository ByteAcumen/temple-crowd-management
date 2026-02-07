const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const http = require('http');
const axios = require('axios');
const { Server } = require('socket.io');
require('dotenv').config();

const logger = require('./config/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes');
const liveRoutes = require('./routes/liveRoutes');
const botRoutes = require('./routes/botRoutes');
const templeRoutes = require('./routes/templeRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Config
const PORT = process.env.PORT || 5000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-service:8000';

// Initialize
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware - Security Headers (Industry Standard)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for Next.js
            styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for Tailwind
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", "ws:", "wss:", "http://localhost:*"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow frontend to load resources
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
    },
}));
app.use(compression()); // Compress all responses
app.use(mongoSanitize()); // Prevent NoSQL Injection
app.use(xss()); // Prevent XSS
app.use(hpp()); // Prevent HTTP Parameter Pollution

// CORS Configuration - Allow credentials with specific origins
const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: logger.stream })); // HTTP request logging

// Rate Limiting (General)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Auth Rate Limiting (Strict - Brute Force Protection)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 login/register requests per windowMs
    message: { success: false, error: 'Too many login attempts, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/v1/auth', authLimiter);

// Mount Routes
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/live', liveRoutes);
app.use('/api/v1/bot', botRoutes);
app.use('/api/v1/temples', templeRoutes);
app.use('/api/v1/admin', adminRoutes);

// Health Check
app.get('/', (req, res) => {
    res.json({
        service: 'Temple Booking API',
        status: 'Healthy',
        ai_link: AI_SERVICE_URL
    });
});

// Socket.io Real-time Configuration
const SocketEvents = require('./events/socketEvents');
const socketEvents = new SocketEvents(io);

io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Join specific temple room
    socket.on('join:temple', (templeId) => {
        socket.join(`temple:${templeId}`);
        logger.info(`Client ${socket.id} joined temple: ${templeId}`);
    });

    // Join admin dashboard room
    socket.on('join:admin', () => {
        socket.join('admin:dashboard');
        logger.info(`Client ${socket.id} joined admin  dashboard`);
    });

    socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });
});

// Make io and socketEvents accessible globally
app.set('io', io);
app.set('socketEvents', socketEvents);

// 404 handler - must be after all routes
app.use(notFound);

// Global error handler - must be last
app.use(errorHandler);

// Export app and server for server.js
module.exports = { app, server, io };
