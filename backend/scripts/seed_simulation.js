const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Load env vars
// Assuming running from backend root: node scripts/seed_simulation.js
dotenv.config({ path: '.env' });

// Models
const User = require('../src/models/User');
const Temple = require('../src/models/Temple');
const Booking = require('../src/models/Booking');

// Connect DB
// Use 'temple_db' (underscore) to match .env
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/temple_db')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ DB Error:', err));

const DATA = {
    temples: [
        {
            name: "Kashi Vishwanath Temple",
            location: { city: "Varanasi", state: "Uttar Pradesh", address: "Lahori Tola" },
            capacity: { total: 5000, per_slot: 400 },
            operatingHours: { open: "04:00", close: "23:00" },
            description: "One of the most famous Hindu temples dedicated to Lord Shiva."
        },
        {
            name: "Tirumala Tirupati Devasthanams",
            location: { city: "Tirumala", state: "Andhra Pradesh", address: "Chittoor District" },
            capacity: { total: 15000, per_slot: 1000 },
            operatingHours: { open: "02:30", close: "23:30" },
            description: "The richest temple in the world, dedicated to Lord Venkateswara."
        },
        {
            name: "Golden Temple",
            location: { city: "Amritsar", state: "Punjab", address: "Atta Mandi" },
            capacity: { total: 8000, per_slot: 600 },
            operatingHours: { open: "03:00", close: "22:00" },
            description: "The holiest Gurdwara of Sikhism, also known as Sri Harmandir Sahib."
        }
    ],
    users: 50,
    bookings: 200
};

const SIMULATION_DATE = new Date();

async function seed() {
    try {
        const force = process.argv.includes('--force');
        const templeCount = await Temple.countDocuments();
        const bookingCount = await Booking.countDocuments();

        if (templeCount > 0 && bookingCount > 0 && !force) {
            console.log('ℹ️  Data already exists. Skipping seed.');
            console.log('   Use "node scripts/seed_simulation.js --force" to wipe and re-seed.');
            process.exit(0);
        }

        if (force) {
            console.log('🧹 Clearing data (--force flag detected)...');
            await Temple.deleteMany({});
            await Booking.deleteMany({});
        } else {
            console.log('✨ Database is empty/incomplete. Seeding...');
        }

        console.log('🏗️ Creating Temples...');
        const createdTemples = await Temple.create(DATA.temples);
        console.log(`✅ Created ${createdTemples.length} temples`);

        console.log('👥 Creating Users...');
        // Create Admin if not exists
        let admin = await User.findOne({ email: 'admin@temple.com' });
        if (!admin) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('Admin@123456', salt);
            admin = await User.create({
                name: 'Super Admin',
                email: 'admin@temple.com',
                password: hashedPassword,
                role: 'admin',
                isSuperAdmin: true
            });
            console.log('✅ Created Super Admin');
        }

        // Create Gatekeeper
        let gatekeeper = await User.findOne({ email: 'gatekeeper@temple.com' });
        if (!gatekeeper) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('Gate@12345', salt);
            gatekeeper = await User.create({
                name: 'Main Gatekeeper',
                email: 'gatekeeper@temple.com',
                password: hashedPassword,
                role: 'gatekeeper',
                assignedTemples: [createdTemples[0]._id] // Assign to first temple
            });
            console.log('✅ Created Gatekeeper');
        }

        const users = [];
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('User@12345', salt);

        for (let i = 0; i < DATA.users; i++) {
            users.push({
                name: `Devotee ${i + 1}`,
                email: i === 0 ? 'user@temple.com' : `user${i + 1}@example.com`, // First user matches request
                password: hashedPassword,
                role: 'user'
            });
        }
        // Bulk insert users is risky if they exist, so we'll skip or upsert. 
        // For simulation, let's assume we can just create them if they don't exist.
        // Simplified:
        const createdUsers = [];
        for (const u of users) {
            const existing = await User.findOne({ email: u.email });
            if (!existing) {
                createdUsers.push(await User.create(u));
            } else {
                createdUsers.push(existing);
            }
        }
        console.log(`✅ Users ready: ${createdUsers.length}`);

        console.log('🎫 Creating Bookings...');
        const bookings = [];
        const statuses = ['CONFIRMED', 'COMPLETED', 'CANCELLED', 'CONFIRMED', 'CONFIRMED']; // Weighted
        const slots = ['06:00 - 08:00', '08:00 - 10:00', '10:00 - 12:00', '12:00 - 14:00', '16:00 - 18:00', '18:00 - 20:00'];

        for (let i = 0; i < DATA.bookings; i++) {
            const temple = createdTemples[Math.floor(Math.random() * createdTemples.length)];
            const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];

            // Random date within last 7 days to next 7 days
            const date = new Date();
            date.setDate(date.getDate() + (Math.floor(Math.random() * 14) - 7));

            bookings.push({
                temple: temple._id,
                templeName: temple.name,
                userId: user._id,
                userName: user.name,
                userEmail: user.email,
                date: date,
                slot: slots[Math.floor(Math.random() * slots.length)],
                visitors: Math.floor(Math.random() * 5) + 1,
                status: status,
                passId: uuidv4(),
                payment: {
                    amount: Math.floor(Math.random() * 500),
                    status: status === 'CANCELLED' ? 'REFUNDED' : 'PAID',
                    payment_method: Math.random() > 0.5 ? 'UPI' : 'CARD'
                }
            });
        }
        await Booking.insertMany(bookings);
        console.log(`✅ Created ${bookings.length} bookings`);

        console.log('📡 Simulating Live Traffic...');
        // Update live count for temples based on "Today's" mock activity
        for (const temple of createdTemples) {
            // Random live count between 100 and capacity * 0.9
            const liveCount = Math.floor(Math.random() * (temple.capacity.total * 0.6)) + 50;
            temple.live_count = liveCount;
            await temple.save();
        }
        console.log('✅ Live traffic simulated');

        console.log('✨ SYSTEM SIMULATION READY ✨');
        console.log('-----------------------------------');
        console.log('Login: admin@temple.com / Admin@123456');
        console.log('Login: gatekeeper@temple.com / Gate@12345');
        console.log('Login: user@temple.com / User@12345');
        console.log('-----------------------------------');
        process.exit();

    } catch (err) {
        console.error('❌ Seed Error:', err);
        process.exit(1);
    }
}

seed();
