const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // MONGO_URI is loaded from process.env (Docker injects this)
        // Default to localhost for local testing without Docker
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/temple_db');

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;
