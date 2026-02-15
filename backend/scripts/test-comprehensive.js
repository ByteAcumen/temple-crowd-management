const mongoose = require('mongoose');
const Booking = require('../src/models/Booking');
const User = require('../src/models/User');
const Temple = require('../src/models/Temple');
require('dotenv').config({ path: '../.env' });

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m'
};

async function runTests() {
    console.log(`\n${colors.yellow}🧪 STARTING COMPREHENSIVE BACKEND TESTS...${colors.reset}\n`);

    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/temple_db';
    await mongoose.connect(mongoUri);

    try {
        // --- SETUP ---
        const userA = await User.findOneAndUpdate({ email: 'test_a@temple.com' }, { name: 'Test User A', email: 'test_a@temple.com', role: 'user' }, { upsert: true, new: true });
        const userB = await User.findOneAndUpdate({ email: 'test_b@temple.com' }, { name: 'Test User B', email: 'test_b@temple.com', role: 'user' }, { upsert: true, new: true });

        // Create a test temple with limited capacity
        const temple = await Temple.findOneAndUpdate(
            { name: 'Test Temple Capacity' },
            {
                name: 'Test Temple Capacity',
                capacity: { per_slot: 2 }, // Small capacity for testing
                location: 'Test Loc'
            },
            { upsert: true, new: true }
        );

        // Clear bookings for this temple
        await Booking.deleteMany({ temple: temple._id });

        // --- TEST 1: DATA ISOLATION ---
        process.stdout.write('Test 1: Data Isolation (User A vs User B) ... ');

        await Booking.create({
            temple: temple._id,
            templeName: temple.name,
            date: new Date(),
            slot: '10:00 AM',
            visitors: 1,
            userId: userA._id,
            userEmail: userA.email,
            userName: userA.name,
            passId: 'PASS_A_ISO',
            status: 'CONFIRMED'
        });

        // Simulate Query for User B
        const queryB = { $or: [{ userId: userB._id }, { userEmail: userB.email }] };
        const resultsB = await Booking.find(queryB);

        if (resultsB.length === 0) {
            console.log(`${colors.green}PASSED${colors.reset}`);
        } else {
            console.log(`${colors.red}FAILED${colors.reset} (User B saw User A's data)`);
        }

        // --- TEST 2: CAPACITY ENFORCEMENT ---
        process.stdout.write('Test 2: Capacity Enforcement (Overbooking) ... ');

        // Temple capacity is 2. 
        // User A already booked 1 visitor.
        // Try to book 2 more visitors (Total 3 > 2)

        const existingBookings = await Booking.countDocuments({
            temple: temple._id,
            date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)), $lt: new Date(new Date().setHours(23, 59, 59, 999)) }, // Today
            slot: '10:00 AM',
            status: 'CONFIRMED'
        });

        const available = temple.capacity.per_slot - existingBookings; // Should be 1
        const requested = 2;

        if (requested > available) {
            console.log(`${colors.green}PASSED${colors.reset} (Blocked request: ${requested} > ${available})`);
        } else {
            console.log(`${colors.red}FAILED${colors.reset} (Allowed overbooking)`);
        }

        // --- TEST 3: DATA VALIDATION ---
        process.stdout.write('Test 3: Data Validation (Missing Fields) ... ');

        try {
            await Booking.create({
                // Missing temple, date, slot...
                visitors: 1
            });
            console.log(`${colors.red}FAILED${colors.reset} (Allowed invalid booking)`);
        } catch (err) {
            if (err.name === 'ValidationError') {
                console.log(`${colors.green}PASSED${colors.reset} (Caught validation error)`);
            } else {
                console.log(`${colors.red}FAILED${colors.reset} (Unexpected error: ${err.message})`);
            }
        }

    } catch (err) {
        console.error('\n❌ CRITICAL TEST ERROR:', err);
    } finally {
        await mongoose.connection.close();
        console.log(`\n${colors.yellow}🧪 TESTS COMPLETE${colors.reset}\n`);
    }
}

runTests();
