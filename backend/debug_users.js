const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './src/.env' });
if (!process.env.MONGO_URI) {
    dotenv.config({ path: './.env' });
}

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String,
    isSuperAdmin: Boolean
});
const User = mongoose.model('User', UserSchema);

const connectDB = async () => {
    try {
        // Try localhost default if env not set
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/temple-pass';
        console.log(`Checking DB at: ${uri}`);
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
};

const run = async () => {
    await connectDB();
    console.log('--- ALL USERS ---');
    const users = await User.find({});
    users.forEach(u => {
        console.log(`- ${u.email} [${u.role}] (SuperAdmin: ${u.isSuperAdmin}) ID: ${u._id}`);
    });
    console.log('-----------------');

    // Check specific admin
    const admin = await User.findOne({ email: 'admin@temple.com' });
    if (admin) {
        console.log('✅ Found admin@temple.com');
    } else {
        console.error('❌ admin@temple.com NOT FOUND');
    }
    process.exit(0);
};

run();
