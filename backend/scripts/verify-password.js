const mongoose = require('mongoose');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://127.0.0.1:27017/temple_db')
    .then(async () => {
        console.log('✅ Connected to DB');

        const email = 'user@temple.com';
        const passwordInput = 'User@12345';

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            console.log(`❌ User ${email} not found in DB!`);
        } else {
            console.log(`✅ User ${email} found.`);
            console.log(`Hash in DB: ${user.password}`);

            const isMatch = await bcrypt.compare(passwordInput, user.password);
            console.log(`Password Match Test ('${passwordInput}'): ${isMatch ? '✅ MATCH' : '❌ FAIL'}`);

            if (!isMatch) {
                // Debugging: What IS the password?
                // We can't know, but we can verify if it matches other common variants or if it's double hashed
                const isDoubleHash = await bcrypt.compare(user.password, user.password); // nonsense check but sometimes revealing
                console.log('Double hash check (nonsense):', isDoubleHash);
            }
        }

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
