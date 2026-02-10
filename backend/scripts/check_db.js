const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database Name: ${conn.connection.name}`);

        // Check Collections
        const collections = await conn.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        // Count Documents
        const users = await conn.connection.db.collection('users').countDocuments();
        const temples = await conn.connection.db.collection('temples').countDocuments();
        const bookings = await conn.connection.db.collection('bookings').countDocuments();

        console.log('\n--- Counts ---');
        console.log(`Users: ${users}`);
        console.log(`Temples: ${temples}`);
        console.log(`Bookings: ${bookings}`);

        // List Users
        if (users > 0) {
            console.log('\n--- All Users ---');
            const userList = await conn.connection.db.collection('users').find({}).toArray();
            userList.forEach(u => console.log(`${u.role.padEnd(12)} | ${u.email}`));
        }

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

connectDB();
