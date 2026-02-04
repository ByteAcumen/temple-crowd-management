const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const http = require('http');
const axios = require('axios');
const { Server } = require('socket.io');
require('dotenv').config();

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

// Middleware
app.use(helmet());
app.use(compression()); // Compress all responses
app.use(cors());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rate Limiting (Security)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

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
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join specific temple room
    socket.on('join:temple', (templeId) => {
        socket.join(`temple:${templeId}`);
        console.log(`📍 Client ${socket.id} joined temple: ${templeId}`);
    });

    // Join admin dashboard room
    socket.on('join:admin', () => {
        socket.join('admin:dashboard');
        console.log(`👨‍💼 Client ${socket.id} joined admin dashboard`);
    });

    socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
    });
});

// Make io and socketEvents accessible globally
app.set('io', io);
app.set('socketEvents', socketEvents);

// Export app and server for server.js
module.exports = { app, server, io };
