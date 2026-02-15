const mongoose = require('mongoose');
const Booking = require('../src/models/Booking');
const User = require('../src/models/User');
require('dotenv').config({ path: '../.env' });

async function testIsolation() {
    console.log('🧪 Starting Booking Isolation Test...');

    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/temple_db';
    await mongoose.connect(mongoUri);

    try {
        // 1. Setup Test Users
        console.log('👤 Setting up test users...');
        const userA = await User.findOneAndUpdate(
            { email: 'usera@test.com' },
            { name: 'User A', email: 'usera@test.com', role: 'user' },
            { upsert: true, new: true }
        );
        const userB = await User.findOneAndUpdate(
            { email: 'userb@test.com' },
            { name: 'User B', email: 'userb@test.com', role: 'user' },
            { upsert: true, new: true }
        );

        // 2. Clear previous test bookings
        await Booking.deleteMany({ userEmail: { $in: ['usera@test.com', 'userb@test.com'] } });

        // 3. User A creates a booking
        console.log('🎫 User A creating booking...');
        const bookingA = await Booking.create({
            temple: new mongoose.Types.ObjectId(), // Fake temple ID
            templeName: 'Test Temple', // Added required field
            date: new Date(),
            slot: '10:00 AM',
            visitors: 1,
            userId: userA._id,
            userEmail: userA.email,
            userName: userA.name,
            passId: 'PASS_A_' + Date.now(),
            status: 'CONFIRMED'
        });

        // 4. User B queries for bookings
        console.log('🕵️ User B trying to fetch bookings...');

        // Emulate getMyBookings query logic
        const queryB = {
            $or: [
                { userId: userB._id },
                { userEmail: userB.email }
            ]
        };

        const resultsB = await Booking.find(queryB);

        console.log(`\n--- RESULTS ---`);
        console.log(`User A (ID: ${userA._id}) created booking: ${bookingA._id}`);
        console.log(`User B (ID: ${userB._id}) found ${resultsB.length} bookings.`);

        if (resultsB.length > 0) {
            console.error('❌ FAILURE: User B can see User A\'s bookings!');
            resultsB.forEach(b => console.log(` - Found: ${b._id} (Owner: ${b.userId}, Email: ${b.userEmail})`));
        } else {
            console.log('✅ SUCCESS: User B cannot see any bookings.');
        }

    } catch (err) {
        console.error('Test Error:', err);
    } finally {
        await mongoose.connection.close();
    }
}

testIsolation();
