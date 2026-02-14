const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Check for both MONGO_URI (Docker) and MONGODB_URI (local .env)
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/temple_db';

        console.log(`🔌 Attempting to connect to MongoDB...`);

        // Connection Pooling for High Load
        const conn = await mongoose.connect(mongoUri, {
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000 // Close sockets after 45 seconds of inactivity
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;
