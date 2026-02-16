const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './src/.env' });
if (!process.env.MONGO_URI) {
    // Fallback for dev environment structure
    dotenv.config({ path: './.env' });
}

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ['user', 'gatekeeper', 'admin'], default: 'user' },
    isSuperAdmin: { type: Boolean, default: false }
});

// Add salt generation method if it doesn't exist in your actual model, 
// but here we just need to hash manually to update.
const User = mongoose.model('User', UserSchema);

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/temple-pass');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
};

const resetPassword = async () => {
    await connectDB();

    const email = 'admin@temple.com';
    const newPassword = 'Admin@123456'; // Matching user's screenshot

    try {
        let user = await User.findOne({ email });

        if (!user) {
            console.log('User not found. Creating new admin...');
            // Create if doesn't exist
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            user = await User.create({
                name: 'Super Admin',
                email,
                password: hashedPassword,
                role: 'admin',
                isSuperAdmin: true
            });
            console.log('Admin created successfully');
        } else {
            console.log('User found. Updating password...');
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            if (!user.isSuperAdmin) {
                user.role = 'admin';
                user.isSuperAdmin = true; // Ensure they have super admin rights
            }
            await user.save();
            console.log('Password updated successfully');
        }

        console.log(`credentials: ${email} / ${newPassword}`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetPassword();
