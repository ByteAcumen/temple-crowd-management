const fs = require('fs');
const path = require('path');

// Resolve backend node_modules path
const backendPath = path.join(__dirname, '../backend');
const mongoose = require(path.join(backendPath, 'node_modules', 'mongoose'));
const dotenv = require(path.join(backendPath, 'node_modules', 'dotenv'));

// Load env vars
dotenv.config({ path: path.join(backendPath, 'src', '.env') });
if (!process.env.MONGO_URI) {
    dotenv.config({ path: path.join(backendPath, '.env') });
}

// Define User Schema (minimal)
const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema);

// Define Booking Schema (minimal for data extraction)
const BookingSchema = new mongoose.Schema({
    date: Date,
    visitors: Number,
    status: String,
    templeName: String
}, { strict: false });
const Booking = mongoose.model('Booking', BookingSchema);

const OUTPUT_FILE = path.join(__dirname, '../ml-services/demand-forecasting/data/training_data.csv');

const run = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/temple_db';
        console.log(`🔌 Connecting to DB: ${uri}`);
        await mongoose.connect(uri);

        console.log('🔍 Fetching confirmed bookings...');
        // Aggregate bookings by date to get total daily visitors per temple
        // For simplicity in Phase 1, we will aggregate globally or per a specific temple if needed.
        // Let's aggregate GLOBAL daily visitors first as a proof of concept.

        const pipeline = [
            { $match: { status: 'CONFIRMED' } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$date" }
                    },
                    total_visitors: { $sum: "$visitors" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } } // Sort by date ascending
        ];

        const results = await Booking.aggregate(pipeline);

        console.log(`📊 Found ${results.length} unique dates with data.`);

        if (results.length === 0) {
            console.log('⚠️ No data found! Please ensure database is seeded.');
            process.exit(0);
        }

        // CSV Header
        let csvContent = "date,day_of_week,is_weekend,visitors\n";

        for (const record of results) {
            const dateStr = record._id;
            const visitors = record.total_visitors;
            const dateObj = new Date(dateStr);

            // Feature Engineering
            const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6) ? 1 : 0;

            csvContent += `${dateStr},${dayOfWeek},${isWeekend},${visitors}\n`;
        }

        // Ensure directory exists
        const dir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(OUTPUT_FILE, csvContent);
        console.log(`✅ Data exported to: ${OUTPUT_FILE}`);
        console.log(`📝 Sample Data:\n${csvContent.split('\n').slice(0, 5).join('\n')}`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

run();
