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
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/temple_db')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ DB Error:', err));

const DATA = {
    temples: [
        {
            name: "Tirumala Tirupati Devasthanams",
            location: { city: "Tirumala", state: "Andhra Pradesh", address: "Chittoor District" },
            capacity: { total: 15000, per_slot: 1000 },
            operatingHours: { open: "02:30", close: "23:30" },
            description: "The richest temple in the world, dedicated to Lord Venkateswara. A masterpiece of Dravidian architecture.",
            imageUrl: "https://images.unsplash.com/photo-1621427642869-0f968d7d9e48?w=800&q=80"
        },
        {
            name: "Kashi Vishwanath Temple",
            location: { city: "Varanasi", state: "Uttar Pradesh", address: "Lahori Tola" },
            capacity: { total: 5000, per_slot: 400 },
            operatingHours: { open: "04:00", close: "23:00" },
            description: "One of the most famous Hindu temples dedicated to Lord Shiva, located on the banks of the Ganges.",
            imageUrl: "https://images.unsplash.com/photo-1561361513-35bdcd01676f?w=800&q=80"
        },
        {
            name: "Golden Temple",
            location: { city: "Amritsar", state: "Punjab", address: "Atta Mandi" },
            capacity: { total: 8000, per_slot: 600 },
            operatingHours: { open: "03:00", close: "22:00" },
            description: "The holiest Gurdwara of Sikhism, also known as Sri Harmandir Sahib. A symbol of human brotherhood.",
            imageUrl: "https://images.unsplash.com/photo-1549646808-0130ee1d6205?w=800&q=80"
            // imageUrl: "https://images.unsplash.com/photo-1588416936097-418eb8a8e363?w=800&q=80"
        },
        {
            name: "Vaishno Devi Temple",
            location: { city: "Katra", state: "Jammu & Kashmir", address: "Trikuta Mountains" },
            capacity: { total: 10000, per_slot: 800 },
            operatingHours: { open: "05:00", close: "22:00" },
            description: "A holy cave shrine dedicated to Mata Vaishno Devi, nestled in the Trikuta Mountains.",
            imageUrl: "https://images.unsplash.com/photo-1626284687550-98319363577d?w=800&q=80"
        },
        {
            name: "Kedarnath Temple",
            location: { city: "Kedarnath", state: "Uttarakhand", address: "Rudraprayag" },
            capacity: { total: 3000, per_slot: 200 },
            operatingHours: { open: "06:00", close: "20:00" },
            description: "Dedicated to Lord Shiva, located in the Garhwal Himalayas near the Mandakini river.",
            imageUrl: "https://images.unsplash.com/photo-1616238122827-b9305c0d57e4?w=800&q=80"
        },
        {
            name: "Badrinath Temple",
            location: { city: "Badrinath", state: "Uttarakhand", address: "Chamoli" },
            capacity: { total: 3500, per_slot: 250 },
            operatingHours: { open: "04:30", close: "21:00" },
            description: "One of the Char Dham pilgrimage sites, dedicated to Lord Vishnu.",
            imageUrl: "https://images.unsplash.com/photo-1631557008138-0dc531604a11?w=800&q=80"
        },
        {
            name: "Somnath Temple",
            location: { city: "Veraval", state: "Gujarat", address: "Prabhas Patan" },
            capacity: { total: 6000, per_slot: 500 },
            operatingHours: { open: "06:00", close: "21:30" },
            description: "The first among the twelve Jyotirlinga shrines of Shiva. A symbol of resilience.",
            imageUrl: "https://images.unsplash.com/photo-1623485556209-216503c004c2?w=800&q=80"
        },
        {
            name: "Dwarkadhish Temple",
            location: { city: "Dwarka", state: "Gujarat", address: "Dwarka" },
            capacity: { total: 5500, per_slot: 450 },
            operatingHours: { open: "06:30", close: "21:30" },
            description: "Dedicated to Lord Krishna, known as the 'King of Dwarka'.",
            imageUrl: "https://images.unsplash.com/photo-1598506841398-356c9a72cd1e?w=800&q=80"
        },
        {
            name: "Jagannath Temple",
            location: { city: "Puri", state: "Odisha", address: "Grand Road" },
            capacity: { total: 12000, per_slot: 900 },
            operatingHours: { open: "05:00", close: "23:00" },
            description: "Famous for its annual Ratha Yatra, dedicated to Lord Jagannath.",
            imageUrl: "https://images.unsplash.com/photo-1627993074092-23c3451bf011?w=800&q=80"
        },
        {
            name: "Meenakshi Amman Temple",
            location: { city: "Madurai", state: "Tamil Nadu", address: "Madurai Main" },
            capacity: { total: 9000, per_slot: 700 },
            operatingHours: { open: "05:00", close: "22:00" },
            description: "A historic Hindu temple located on the southern bank of the Vaigai River.",
            imageUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80"
        },
        {
            name: "Ramanathaswamy Temple",
            location: { city: "Rameswaram", state: "Tamil Nadu", address: "Rameswaram Island" },
            capacity: { total: 7000, per_slot: 500 },
            operatingHours: { open: "05:00", close: "21:00" },
            description: "One of the twelve Jyotirlinga temples, known for its long corridors.",
            imageUrl: "https://images.unsplash.com/photo-1647891783268-bb920e54d6fa?w=800&q=80"
        },
        {
            name: "Siddhivinayak Temple",
            location: { city: "Mumbai", state: "Maharashtra", address: "Prabhadevi" },
            capacity: { total: 15000, per_slot: 1200 },
            operatingHours: { open: "05:30", close: "22:00" },
            description: "Dedicated to Lord Shri Ganesh, one of the richest temples in Mumbai.",
            imageUrl: "https://images.unsplash.com/photo-1605333140510-1c4917649539?w=800&q=80"
        },
        {
            name: "Shirdi Sai Baba Temple",
            location: { city: "Shirdi", state: "Maharashtra", address: "Ahmednagar" },
            capacity: { total: 20000, per_slot: 1500 },
            operatingHours: { open: "04:00", close: "23:00" },
            description: "The resting place of the famous saint Sai Baba.",
            imageUrl: "https://images.unsplash.com/photo-1594132711666-86c34b8c62c2?w=800&q=80"
        },
        {
            name: "Padmanabhaswamy Temple",
            location: { city: "Thiruvananthapuram", state: "Kerala", address: "East Fort" },
            capacity: { total: 6000, per_slot: 400 },
            operatingHours: { open: "03:30", close: "21:00" },
            description: "Dedicated to Lord Vishnu, one of the richest temples in the world.",
            imageUrl: "https://images.unsplash.com/photo-1627993074092-23c3451bf011?w=800&q=80"
        },
        {
            name: "Konark Sun Temple",
            location: { city: "Konark", state: "Odisha", address: "Konark" },
            capacity: { total: 4000, per_slot: 350 },
            operatingHours: { open: "06:00", close: "20:00" },
            description: "A 13th-century CE Sun Temple, a UNESCO World Heritage Site.",
            imageUrl: "https://images.unsplash.com/photo-1563721345-4293f03a63ec?w=800&q=80"
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
            await User.deleteMany({});
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
            // const salt = await bcrypt.genSalt(10);
            // const hashedPassword = await bcrypt.hash('Admin@123456', salt);
            admin = await User.create({
                name: 'Super Admin',
                email: 'admin@temple.com',
                password: 'Admin@123456',
                role: 'admin',
                isSuperAdmin: true
            });
            console.log('✅ Created Super Admin');
        }

        // Create Gatekeeper
        let gatekeeper = await User.findOne({ email: 'gatekeeper@temple.com' });
        if (!gatekeeper) {
            // const salt = await bcrypt.genSalt(10);
            // const hashedPassword = await bcrypt.hash('Gate@12345', salt);
            gatekeeper = await User.create({
                name: 'Main Gatekeeper',
                email: 'gatekeeper@temple.com',
                password: 'Gate@12345',
                role: 'gatekeeper',
                assignedTemples: [createdTemples[0]._id] // Assign to first temple
            });
            console.log('✅ Created Gatekeeper');
        }

        const users = [];
        // const salt = await bcrypt.genSalt(10);
        // const hashedPassword = await bcrypt.hash('User@12345', salt);

        for (let i = 0; i < DATA.users; i++) {
            let email = `user${i + 1}@example.com`;
            let name = `Devotee ${i + 1}`;

            if (i === 0) {
                email = 'user@temple.com';
                name = 'Devotee User';
            } else if (i === 1) {
                email = 'ram@temple.com';
                name = 'Ram';
            } else if (i === 2) { // Add the specific requested Ram email
                email = 'Ram123@gmail.com';
                name = 'Ram Gmail';
            }

            users.push({
                name,
                email,
                password: i === 2 ? 'R@m123456789' : 'User@12345', // Specific password for Ram Gmail
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
        const statuses = ['CONFIRMED', 'USED', 'CANCELLED', 'CONFIRMED', 'CONFIRMED']; // Weighted
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
