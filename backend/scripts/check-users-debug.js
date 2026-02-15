const mongoose = require('mongoose');
const User = require('../src/models/User');

mongoose.connect('mongodb://127.0.0.1:27017/temple_db')
    .then(async () => {
        console.log('✅ Connected');
        const users = await User.find({
            email: { $in: ['user@temple.com', 'ram@temple.com', 'ram@gmail.com'] }
        });
        console.log('Found Users:', users);

        // Also list all users just in case "ram" has a different email
        const allUsers = await User.find({}, 'name email role');
        console.log('All Users (Name/Email):');
        allUsers.forEach(u => console.log(`- ${u.name} (${u.email})`));

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
