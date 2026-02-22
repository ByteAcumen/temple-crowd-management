const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Booking = require('../src/models/Booking');
const Temple = require('../src/models/Temple');
const User = require('../src/models/User');
const redis = require('../src/config/redis');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function seed() {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);

    // Check if redis handles promise or if we connect manually
    if (typeof redis.connect === 'function' && !redis.isOpen) {
        try { await redis.connect(); } catch (e) { }
    }

    const temples = await Temple.find({});
    const users = await User.find({});

    if (temples.length === 0 || users.length === 0) {
        console.log("No temples or users found. Exiting.");
        return process.exit(1);
    }

    const statuses = ['CONFIRMED', 'USED', 'CANCELLED'];
    const timeSlots = ["06:00 - 08:00", "08:00 - 10:00", "10:00 - 12:00", "16:00 - 18:00", "18:00 - 20:00"];

    // Generate random bookings over the last 30 days
    console.log('Generating realistic 30-day booking data...');
    const newBookings = [];

    for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        // Make weekends busier
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        let dailyTarget = Math.floor(Math.random() * 20) + (isWeekend ? 50 : 15);

        for (let j = 0; j < dailyTarget; j++) {
            const temple = temples[Math.floor(Math.random() * temples.length)];
            const user = users[Math.floor(Math.random() * users.length)];

            // Distribute hours logically
            let hour = 12;
            const rand = Math.random();
            if (rand < 0.2) hour = Math.floor(Math.random() * 3) + 7;      // 7-9 AM
            else if (rand < 0.45) hour = Math.floor(Math.random() * 4) + 10; // 10 AM - 1 PM
            else if (rand < 0.8) hour = Math.floor(Math.random() * 4) + 16;  // 4-8 PM
            else hour = Math.floor(Math.random() * 24);

            const createdAt = new Date(date);
            createdAt.setHours(hour, Math.floor(Math.random() * 60));

            const hasPaid = Math.random() > 0.1;

            newBookings.push({
                temple: temple._id,
                templeName: temple.name,
                user: user._id,
                userName: user.name,
                userEmail: user.email,
                date: createdAt,
                slot: timeSlots[Math.floor(Math.random() * timeSlots.length)],
                timeSlot: timeSlots[Math.floor(Math.random() * timeSlots.length)],
                visitors: Math.floor(Math.random() * 5) + 1,
                status: statuses[Math.floor(Math.random() * statuses.length)],
                payment: {
                    status: hasPaid ? 'PAID' : 'PENDING',
                    amount: hasPaid ? (Math.floor(Math.random() * 6) + 1) * 200 : 0,
                    transactionId: hasPaid ? 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase() : null
                },
                passId: 'PASS_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                createdAt: createdAt
            });
        }
    }

    // Insert Bookings
    await Booking.insertMany(newBookings);
    console.log(`✅ Inserted ${newBookings.length} realistic bookings into MongoDB.`);

    // Seed Live Counts
    console.log('Generating live crowd data...');
    for (const temple of temples) {
        const capacity = typeof temple.capacity === 'number' ? temple.capacity : (temple.capacity?.total || 1000);

        // Random live count between 5% and 85%
        const isBusy = Math.random() > 0.7;
        const multiplier = isBusy ? (0.6 + Math.random() * 0.3) : (0.05 + Math.random() * 0.3);
        const liveCount = Math.floor(capacity * multiplier);

        // Update Redis
        const countKey = `temple:${temple._id}:live_count`;
        try {
            if (redis.set) {
                await redis.set(countKey, liveCount);
            }
        } catch (e) {
            console.log("Redis not active, skipping redis injection.");
        }

        // Update DB
        await Temple.findByIdAndUpdate(temple._id, { live_count: liveCount });
        console.log(`🎟️  Temple ${temple.name} live count set to ${liveCount}`);
    }

    console.log('✅ Data seeding completed successfully.');
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
