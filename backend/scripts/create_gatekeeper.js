const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './src/.env' });
if (!process.env.MONGO_URI) {
    dotenv.config({ path: './.env' });
}

// Minimal User Schema
const UserSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'gatekeeper', 'admin'],
        default: 'user'
    },
    isSuperAdmin: {
        type: Boolean,
        default: false
    }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', UserSchema);

const createGatekeeper = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/temple-pass';
        console.log(`Connecting to: ${uri}`);
        await mongoose.connect(uri);

        const email = 'gatekeeper@temple.com';
        const password = 'password123';

        // Check availability
        const exists = await User.findOne({ email });
        if (exists) {
            console.log('Gatekeeper user already exists. Updating password...');
            exists.password = password;
            exists.role = 'gatekeeper';
            await exists.save();
            console.log('✅ Gatekeeper updated.');
        } else {
            const user = new User({
                name: 'Temple Gatekeeper',
                email,
                password,
                role: 'gatekeeper',
                isSuperAdmin: false
            });
            await user.save();
            console.log('✅ Gatekeeper created.');
        }

        console.log(`\nEmail: ${email}`);
        console.log(`Password: ${password}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

createGatekeeper();
