/**
 * Database Seed Script
 * 
 * Creates default admin user and sample temples for testing.
 * Run: node scripts/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Colors for output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

const pass = (msg) => console.log(`${colors.green}[OK]${colors.reset} ${msg}`);
const fail = (msg) => console.log(`${colors.red}[FAIL]${colors.reset} ${msg}`);
const info = (msg) => console.log(`${colors.yellow}[INFO]${colors.reset} ${msg}`);

// Import models
const User = require('../src/models/User');
const Temple = require('../src/models/Temple');

// Default Admin User
const DEFAULT_ADMIN = {
    name: 'Temple Admin',
    email: 'admin@temple.com',
    password: 'Admin@123456',
    role: 'admin'
};

// Default Gatekeeper User
const DEFAULT_GATEKEEPER = {
    name: 'Gate Keeper',
    email: 'gatekeeper@temple.com',
    password: 'Gate@123456',
    role: 'gatekeeper'
};

// Default Devotee User
const DEFAULT_USER = {
    name: 'Devotee',
    email: 'user@temple.com',
    password: 'User@12345',
    role: 'user'
};

// Sample Temples (matching Temple model schema)
const SAMPLE_TEMPLES = [
    {
        name: 'Kashi Vishwanath Temple',
        location: { city: 'Varanasi', state: 'Uttar Pradesh', address: 'Lahori Tola, Varanasi' },
        capacity: { total: 5000, per_slot: 500, threshold_warning: 70, threshold_critical: 90 },
        status: 'OPEN',
        slots: [
            { time: '04:00 AM - 11:00 AM', max_capacity: 1500 },
            { time: '12:00 PM - 07:00 PM', max_capacity: 2000 },
            { time: '07:00 PM - 09:00 PM', max_capacity: 1500 }
        ],
        contact: { phone: '+91-542-2392629', email: 'info@kashivishwanath.org', website: 'https://shrikashivishwanath.org' }
    },
    {
        name: 'Tirupati Balaji Temple',
        location: { city: 'Tirupati', state: 'Andhra Pradesh', address: 'Tirumala Hill' },
        capacity: { total: 10000, per_slot: 1000, threshold_warning: 75, threshold_critical: 95 },
        status: 'OPEN',
        slots: [
            { time: '03:00 AM - 04:00 AM', max_capacity: 500 },
            { time: '06:00 AM - 10:00 PM', max_capacity: 8000 },
            { time: '06:00 AM - 08:00 PM (VIP)', max_capacity: 1500 }
        ],
        contact: { phone: '+91-877-2277777', email: 'info@tirumala.org', website: 'https://tirumala.org' }
    },
    {
        name: 'Golden Temple',
        location: { city: 'Amritsar', state: 'Punjab', address: 'Golden Temple Road' },
        capacity: { total: 8000, per_slot: 800, threshold_warning: 70, threshold_critical: 85 },
        status: 'OPEN',
        slots: [
            { time: '02:30 AM - 06:00 AM', max_capacity: 2000 },
            { time: '06:00 AM - 10:00 PM', max_capacity: 5000 },
            { time: '10:00 PM - 02:30 AM', max_capacity: 1000 }
        ],
        contact: { phone: '+91-183-2553954', email: 'info@goldentemple.org', website: 'https://sgpc.net' }
    },
    {
        name: 'Meenakshi Temple',
        location: { city: 'Madurai', state: 'Tamil Nadu', address: 'Madurai Main Road' },
        capacity: { total: 6000, per_slot: 600, threshold_warning: 70, threshold_critical: 90 },
        status: 'OPEN',
        slots: [
            { time: '05:00 AM - 12:30 PM', max_capacity: 3000 },
            { time: '04:00 PM - 10:00 PM', max_capacity: 3000 }
        ],
        contact: { phone: '+91-452-2349393', email: 'info@meenakshitemple.org' }
    },
    {
        name: 'Jagannath Temple',
        location: { city: 'Puri', state: 'Odisha', address: 'Grand Road, Puri' },
        capacity: { total: 7000, per_slot: 700, threshold_warning: 65, threshold_critical: 85 },
        status: 'OPEN',
        slots: [
            { time: '05:00 AM - 06:00 AM (Aarti)', max_capacity: 1000 },
            { time: '06:00 AM - 09:00 PM', max_capacity: 5000 },
            { time: '07:00 PM - 08:00 PM (Sandhya)', max_capacity: 1000 }
        ],
        contact: { phone: '+91-6752-223002', email: 'info@jagannathtemple.org' }
    },
    {
        name: 'Siddhivinayak Temple',
        location: { city: 'Mumbai', state: 'Maharashtra', address: 'Prabhadevi' },
        capacity: { total: 4000, per_slot: 400, threshold_warning: 75, threshold_critical: 95 },
        status: 'OPEN',
        slots: [
            { time: '05:30 AM - 12:00 PM', max_capacity: 2000 },
            { time: '12:00 PM - 09:30 PM', max_capacity: 2000 }
        ],
        contact: { phone: '+91-22-24222290', email: 'info@siddhivinayak.org', website: 'https://siddhivinayak.org' }
    }
];

async function seedDatabase() {
    console.log(`\n${colors.cyan}=== DATABASE SEED SCRIPT ===${colors.reset}\n`);

    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/temple_db';
    info(`Connecting to: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);

    try {
        await mongoose.connect(mongoUri);
        pass('Connected to MongoDB');
    } catch (error) {
        fail(`MongoDB connection failed: ${error.message}`);
        process.exit(1);
    }

    // Create Admin User
    console.log(`\n${colors.cyan}Creating Users...${colors.reset}`);

    // Create Admin User
    console.log(`\n${colors.cyan}Creating Users...${colors.reset}`);

    const adminHashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
    const adminUser = await User.findOneAndUpdate(
        { email: DEFAULT_ADMIN.email },
        {
            ...DEFAULT_ADMIN,
            password: adminHashedPassword
        },
        { new: true, upsert: true }
    );
    pass(`Admin user ready: ${DEFAULT_ADMIN.email} (password: ${DEFAULT_ADMIN.password})`);

    // Create Gatekeeper User
    const gatekeeperHashedPassword = await bcrypt.hash(DEFAULT_GATEKEEPER.password, 10);
    const gatekeeperUser = await User.findOneAndUpdate(
        { email: DEFAULT_GATEKEEPER.email },
        {
            ...DEFAULT_GATEKEEPER,
            password: gatekeeperHashedPassword
        },
        { new: true, upsert: true }
    );
    pass(`Gatekeeper user ready: ${DEFAULT_GATEKEEPER.email} (password: ${DEFAULT_GATEKEEPER.password})`);

    // Create Devotee User
    const userHashedPassword = await bcrypt.hash(DEFAULT_USER.password, 10);
    const devoteeUser = await User.findOneAndUpdate(
        { email: DEFAULT_USER.email },
        {
            ...DEFAULT_USER,
            password: userHashedPassword
        },
        { new: true, upsert: true }
    );
    pass(`Devotee user ready: ${DEFAULT_USER.email} (password: ${DEFAULT_USER.password})`);

    // Create Temples
    console.log(`\n${colors.cyan}Creating Temples...${colors.reset}`);

    for (const templeData of SAMPLE_TEMPLES) {
        let temple = await Temple.findOne({ name: templeData.name });
        if (temple) {
            info(`Temple already exists: ${templeData.name}`);
        } else {
            temple = await Temple.create(templeData);
            pass(`Created temple: ${templeData.name}`);
        }
    }

    // Summary
    const userCount = await User.countDocuments();
    const templeCount = await Temple.countDocuments();

    console.log(`\n${colors.cyan}=== SEED COMPLETE ===${colors.reset}`);
    console.log(`Users: ${userCount}`);
    console.log(`Temples: ${templeCount}`);
    console.log(`\nTest Credentials:`);
    console.log(`  Admin: ${DEFAULT_ADMIN.email} / ${DEFAULT_ADMIN.password}`);
    console.log(`  Gatekeeper: ${DEFAULT_GATEKEEPER.email} / ${DEFAULT_GATEKEEPER.password}`);
    console.log(`  Devotee:    ${DEFAULT_USER.email} / ${DEFAULT_USER.password}\n`);

    await mongoose.connection.close();
    pass('Database connection closed');
}

seedDatabase().catch(console.error);
