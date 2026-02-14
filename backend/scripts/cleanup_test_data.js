const mongoose = require('mongoose');

// MongoDB Connection
const MONGODB_URI = 'mongodb://127.0.0.1:27017/temple_db';

async function cleanupTestData() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;

        // Get collections
        const bookingsCollection = db.collection('bookings');
        const usersCollection = db.collection('users');

        // Count before deletion
        const bookingCount = await bookingsCollection.countDocuments();
        const testUserCount = await usersCollection.countDocuments({ email: { $regex: /test|user@temple\.com/i } });

        console.log(`\n📊 Current Status:`);
        console.log(`   Bookings: ${bookingCount}`);
        console.log(`   Test Users: ${testUserCount}`);

        // Delete test bookings (keep only real user bookings if any)
        const deleteResult = await bookingsCollection.deleteMany({
            $or: [
                { userEmail: 'user@temple.com' },
                { userName: 'Test User' },
                { templeName: 'Test Temple' }
            ]
        });

        console.log(`\n🗑️  Cleanup Results:`);
        console.log(`   ✅ Deleted ${deleteResult.deletedCount} test bookings`);

        // Optional: Delete test user account (uncomment if needed)
        // const userDeleteResult = await usersCollection.deleteMany({
        //     email: 'user@temple.com'
        // });
        // console.log(`   ✅ Deleted ${userDeleteResult.deletedCount} test users`);

        console.log('\n✨ Database cleaned successfully!');

    } catch (error) {
        console.error('❌ Error cleaning database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Disconnected from MongoDB');
    }
}

cleanupTestData();
