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
            capacity: { total: 25000, per_slot: 1500 },
            operatingHours: { regular: { opens: "02:30", closes: "23:30" } },
            description: "The richest temple in the world, dedicated to Lord Venkateswara. Situated on the Venkata Hill, it is a masterpiece of Dravidian architecture and the most visited holy place in the world.",
            deity: "Lord Venkateswara (Balaji)",
            significance: "Bhuloka Vaikuntam (Abode of Vishnu on Earth). Believed to grant moksha in Kali Yuga.",
            rules: {
                dressCode: { men: "Dhoti or Pyjama with Upper Cloth", women: "Saree or Churidar with Dupatta" },
                photography: { allowed: false, restrictions: "Strictly prohibited inside complex" }
            },
            imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4e/A_View_of_Tirumala_Venkateswara_Temple.JPG"
        },
        {
            name: "Kashi Vishwanath Temple",
            location: { city: "Varanasi", state: "Uttar Pradesh", address: "Lahori Tola, Varanasi" },
            capacity: { total: 8000, per_slot: 600 },
            operatingHours: { regular: { opens: "03:00", closes: "23:00" } },
            description: "One of the most famous Hindu temples dedicated to Lord Shiva. Located on the western bank of the holy river Ganga, it is one of the twelve Jyotirlingas.",
            deity: "Lord Shiva (Vishweshwara)",
            significance: "Spiritual heart of India. A visit here and a bath in the Ganges is believed to lead to Moksha.",
            rules: {
                dressCode: { men: "Dhoti-Kurta preferred for sanctum", women: "Saree or traditional wear" },
                photography: { allowed: false, restrictions: "Deposited at locker" }
            },
            imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Kashi_Vishwanath_Temple_Main_Area-3.jpg"
        },
        {
            name: "Golden Temple",
            location: { city: "Amritsar", state: "Punjab", address: "Atta Mandi, Amritsar" },
            capacity: { total: 15000, per_slot: 1000 },
            operatingHours: { regular: { opens: "03:00", closes: "22:30" } },
            description: "Sri Harmandir Sahib, known as the Golden Temple, is the holiest Gurdwara of Sikhism. It stands as a symbol of human brotherhood and equality.",
            deity: "Guru Granth Sahib",
            significance: "Central religious place of the Sikhs. Represents openness to all people regardless of religion or caste.",
            rules: {
                dressCode: { men: "Head covering mandatory", women: "Head covering mandatory" },
                photography: { allowed: true, restrictions: "Allowed in outer complex" }
            },
            imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Amritsar-_The_Golden_Temple.jpg/1280px-Amritsar-_The_Golden_Temple.jpg"
        },
        {
            name: "Vaishno Devi Temple",
            location: { city: "Katra", state: "Jammu & Kashmir", address: "Trikuta Mountains" },
            capacity: { total: 12000, per_slot: 800 },
            operatingHours: { regular: { opens: "05:00", closes: "22:00" } },
            description: "A holy cave shrine dedicated to Mata Vaishno Devi, nestled in the Trikuta Mountains. One of the most visited pilgrimage centers in India.",
            deity: "Mata Vaishno Devi",
            significance: "A Shakti Peeth where the Goddess fulfills all righteous wishes (Manokamana).",
            rules: {
                dressCode: { men: "Decent traditional wear", women: "Saree or Suit" },
                photography: { allowed: false, restrictions: "Prohibited in cave" }
            },
            imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ed/Shri_Mata_Vaishno_Devi_Bhawan%2C_Katra_Jammu_%26_Kashmir_INDIA.jpg"
        },
        {
            name: "Kedarnath Temple",
            location: { city: "Kedarnath", state: "Uttarakhand", address: "Rudraprayag District" },
            capacity: { total: 4000, per_slot: 300 },
            operatingHours: { regular: { opens: "04:00", closes: "21:00" } },
            description: "Dedicated to Lord Shiva, located in the Garhwal Himalayas. Open only between April and November due to extreme weather condition.",
            deity: "Lord Shiva (Kedarnath)",
            significance: "Highest of the 12 Jyotirlingas. Part of Chota Char Dham.",
            rules: {
                dressCode: { men: "Heavy plenty woolens", women: "Heavy plenty woolens" },
                photography: { allowed: true, restrictions: "Restricted inside sanctum" }
            },
            imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Kedarnath_temple%2C_Uttrakhand_06.jpg"
        },
        {
            name: "Badrinath Temple",
            location: { city: "Badrinath", state: "Uttarakhand", address: "Chamoli District" },
            capacity: { total: 5000, per_slot: 400 },
            operatingHours: { regular: { opens: "04:30", closes: "21:00" } },
            description: "A Hindu temple dedicated to Lord Vishnu. It is one of the Char Dham pilgrimage sites. The image of the presiding deity is of black stone.",
            deity: "Lord Vishnu (Badri Vishal)",
            significance: "One of the 108 Divya Desams. Place where Nara-Narayana meditated.",
            rules: {
                dressCode: { men: "Traditional wear", women: "Traditional wear" },
                photography: { allowed: false, restrictions: "Prohibited inside" }
            },
            imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d1/Badrinath_temple_DSCN9998.jpg"
        },
        {
            name: "Somnath Temple",
            location: { city: "Veraval", state: "Gujarat", address: "Prabhas Patan" },
            capacity: { total: 7000, per_slot: 500 },
            operatingHours: { regular: { opens: "06:00", closes: "21:30" } },
            description: "The first among the twelve Jyotirlinga shrines of Shiva. A symbol of resilience, rebuilt many times after destruction.",
            deity: "Lord Shiva (Somnath)",
            significance: "The Eternal Shrine. Believed to be the place where the Moon God worshipped Shiva.",
            rules: {
                dressCode: { men: "Pants/Shirt or Dhoti", women: "Saree/Suit" },
                photography: { allowed: false, restrictions: "Strictly prohibited" }
            },
            imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Somanath_Temple.jpg/1280px-Somanath_Temple.jpg"
        },
        {
            name: "Dwarkadhish Temple",
            location: { city: "Dwarka", state: "Gujarat", address: "Dwarka" },
            capacity: { total: 6000, per_slot: 450 },
            operatingHours: { regular: { opens: "06:30", closes: "21:30" } },
            description: "Dedicated to Lord Krishna, known as the 'King of Dwarka'. The main shrine, known as Jagat Mandir, is a 5-storied building supported by 72 pillars.",
            deity: "Lord Krishna (Dwarkadhish)",
            significance: "One of the Char Dham. Kingdom of Lord Krishna.",
            rules: {
                dressCode: { men: "Modest clothing", women: "Modest clothing" },
                photography: { allowed: false, restrictions: "Prohibited" }
            },
            imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/82/Dwarakadhish_Temple_Of_Lord_Krishna%2C_At_Dwarka%2C_Gujarat..JPG"
        },
        {
            name: "Jagannath Temple",
            location: { city: "Puri", state: "Odisha", address: "Grand Road" },
            capacity: { total: 20000, per_slot: 1200 },
            operatingHours: { regular: { opens: "05:00", closes: "23:00" } },
            description: "Famous for its annual Ratha Yatra. The temple is an important pilgrimage destination and one of the Char Dham.",
            deity: "Lord Jagannath (Krishna)",
            significance: "Abode of the Lord of the Universe. Famous for Mahaprasad.",
            rules: {
                dressCode: { men: "Dhoti/Full Pants", women: "Saree/Salwar" },
                photography: { allowed: false, restrictions: "Strictly prohibited" }
            },
            imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Jagannath_Temple%2C_Puri_05.jpg"
        },
        {
            name: "Meenakshi Amman Temple",
            location: { city: "Madurai", state: "Tamil Nadu", address: "Madurai Main" },
            capacity: { total: 10000, per_slot: 800 },
            operatingHours: { regular: { opens: "05:00", closes: "22:00" } },
            description: "A historic Hindu temple located on the southern bank of the Vaigai River. Known for its towering gopurams and thousands of pillars.",
            deity: "Goddess Meenakshi & Lord Sundareswarar",
            significance: "Masterpiece of Dravidian architecture. A major Shakti Peeth.",
            rules: {
                dressCode: { men: "Dhoti/Pants (No shorts)", women: "Saree/Salwar (No sleeveless)" },
                photography: { allowed: false, restrictions: "Mobile phones banned inside" }
            },
            imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Meenakshi_Amman_Temple%2C_Madurai.jpg"
        },
        {
            name: "Ramanathaswamy Temple",
            location: { city: "Rameswaram", state: "Tamil Nadu", address: "Rameswaram Island" },
            capacity: { total: 8000, per_slot: 600 },
            operatingHours: { regular: { opens: "05:00", closes: "21:00" } },
            description: "One of the twelve Jyotirlinga temples. Known for its long corridors with over 1200 pillars and 22 holy wells (Theerthams).",
            deity: "Lord Shiva (Ramanathaswamy)",
            significance: "Place where Lord Rama worshipped Shiva to absolve sins.",
            rules: {
                dressCode: { men: "Dhoti/Pyjama", women: "Saree/Churidar" },
                photography: { allowed: false, restrictions: "Prohibited in inner sanctum" }
            },
            imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Ramanathaswamy_Temple%2C_Rameshwaram%2C_Tamil_Nadu.jpg"
        },
        {
            name: "Siddhivinayak Temple",
            location: { city: "Mumbai", state: "Maharashtra", address: "Prabhadevi" },
            capacity: { total: 18000, per_slot: 1200 },
            operatingHours: { regular: { opens: "05:30", closes: "22:00" } },
            description: "Dedicated to Lord Shri Ganesh. It is one of the richest temples in Mumbai and frequented by Bollywood stars and politicians.",
            deity: "Lord Ganesha (Siddhivinayak)",
            significance: "Navasacha Ganapati (Granter of wishes).",
            rules: {
                dressCode: { men: "Decent attire", women: "Decent attire" },
                photography: { allowed: false, restrictions: "Prohibited" }
            },
            imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Shree_Siddhivinayak_Temple_Mumbai.jpg"
        },
        {
            name: "Shirdi Sai Baba Temple",
            location: { city: "Shirdi", state: "Maharashtra", address: "Ahmednagar" },
            capacity: { total: 25000, per_slot: 2000 },
            operatingHours: { regular: { opens: "04:00", closes: "23:00" } },
            description: "The resting place of the famous saint Sai Baba. A place where people of all religions come to pay homage.",
            deity: "Sai Baba",
            significance: "Symbol of 'Sabka Malik Ek' (One God helps all).",
            rules: {
                dressCode: { men: "Civilized dress", women: "Civilized dress" },
                photography: { allowed: false, restrictions: "Cameras not allowed" }
            },
            imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Sri_Sai_Baba_Temple_%2C_Shirdi.jpg"
        },
        {
            name: "Padmanabhaswamy Temple",
            location: { city: "Thiruvananthapuram", state: "Kerala", address: "East Fort" },
            capacity: { total: 6000, per_slot: 400 },
            operatingHours: { regular: { opens: "03:30", closes: "20:30" } },
            description: "Dedicated to Lord Vishnu, one of the richest temples in the world. The Lord reclines on the serpent Anantha.",
            deity: "Lord Vishnu (Padmanabha)",
            significance: "One of the 108 Divya Desams. Known for its secret vaults.",
            rules: {
                dressCode: { men: "Mundu/Dhoti (No shirts)", women: "Saree/Set Mundu" },
                photography: { allowed: false, restrictions: "Strictly prohibited" }
            },
            imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Padmanabha_swamy_temple.jpg"
        },
        {
            name: "Konark Sun Temple",
            location: { city: "Konark", state: "Odisha", address: "Konark" },
            capacity: { total: 5000, per_slot: 400 },
            operatingHours: { regular: { opens: "06:00", closes: "20:00" } },
            description: "A 13th-century CE Sun Temple, a UNESCO World Heritage Site. Designed as a colossal chariot of the Sun God.",
            deity: "Surya (Sun God)",
            significance: "Architectural marvel. UNESCO World Heritage Site. No active worship in sanctum.",
            rules: {
                dressCode: { men: "Casual", women: "Casual" },
                photography: { allowed: true, restrictions: "Allowed everywhere" }
            },
            imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/23/Sun_Temple_at_Konark.jpg"
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
