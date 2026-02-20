const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './src/.env' });
if (!process.env.MONGO_URI) {
    dotenv.config({ path: './.env' });
}

// Minimal Schemas for query
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    role: String,
    createdAt: Date
});
const User = mongoose.model('User', UserSchema);

const BookingSchema = new mongoose.Schema({
    user: mongoose.Schema.Types.ObjectId,
    userEmail: String,
    templeName: String,
    date: Date,
    status: String,
    visitors: Number,
    passId: String
});
const Booking = mongoose.model('Booking', BookingSchema);

const run = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/temple-pass';
        console.log(`Connecting to DB...`);
        await mongoose.connect(uri);

        const searchQuery = 'vinod';
        console.log(`\n🔍 Searching for user: "${searchQuery}"...`);

        // Find Users
        const users = await User.find({
            name: { $regex: searchQuery, $options: 'i' }
        });

        if (users.length === 0) {
            console.log('❌ No users found with that name.');
        } else {
            console.log(`✅ Found ${users.length} user(s):\n`);

            for (const user of users) {
                console.log('------------------------------------------------');
                console.log(`👤 USER DETAILS`);
                console.log(`ID:       ${user._id}`);
                console.log(`Name:     ${user.name}`);
                console.log(`Email:    ${user.email}`);
                console.log(`Role:     ${user.role}`);
                console.log(`Phone:    ${user.phone || 'N/A'}`);
                console.log(`Created:  ${user.createdAt}`);

                // Find Bookings for this user
                const bookings = await Booking.find({
                    $or: [
                        { user: user._id },
                        { userEmail: user.email }
                    ]
                });

                console.log(`\n🎫 BOOKINGS (${bookings.length})`);
                if (bookings.length > 0) {
                    bookings.forEach((b, i) => {
                        console.log(`\n  [${i + 1}] ${b.templeName}`);
                        console.log(`      Date:    ${b.date}`);
                        console.log(`      Status:  ${b.status}`);
                        console.log(`      PassID:  ${b.passId}`);
                        console.log(`      Visitors: ${b.visitors}`);
                    });
                } else {
                    console.log('  No bookings found.');
                }
                console.log('------------------------------------------------\n');
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
