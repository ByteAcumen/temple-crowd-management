const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // MONGO_URI is loaded from process.env (Docker injects this)
        // Default to localhost for local testing without Docker
        // Connection Pooling for High Load
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/temple_db', {
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;
