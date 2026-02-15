const mongoose = require('mongoose');
const User = require('../src/models/User');

mongoose.connect('mongodb://127.0.0.1:27017/temple_db')
    .then(async () => {
        console.log('✅ Connected');

        const accounts = [
            {
                name: 'Devotee User',
                email: 'user@temple.com',
                password: 'User@12345',
                role: 'user'
            },
            {
                name: 'Ram',
                email: 'Ram123@gmail.com',
                password: 'R@m123456789',
                role: 'user'
            }
        ];

        for (const acc of accounts) {
            let user = await User.findOne({ email: acc.email });
            if (user) {
                console.log(`Updating existing user: ${acc.email}`);
                user.password = acc.password; // Trigger pre-save hash
                await user.save();
                console.log(`✅ Updated password for ${acc.email}`);
            } else {
                console.log(`Creating new user: ${acc.email}`);
                await User.create(acc);
                console.log(`✅ Created user ${acc.email}`);
            }
        }

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
