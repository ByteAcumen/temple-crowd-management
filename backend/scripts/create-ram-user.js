const mongoose = require('mongoose');
const User = require('../src/models/User');

mongoose.connect('mongodb://127.0.0.1:27017/temple_db')
    .then(async () => {
        console.log('✅ Connected');

        // Define Ram
        const ramData = {
            name: 'Ram',
            email: 'ram@temple.com',
            password: 'User@12345', // using plain text as model handles hashing
            role: 'user'
        };

        // Check if exists
        let user = await User.findOne({ email: ramData.email });
        if (user) {
            console.log('User Ram already exists. Updating password...');
            user.password = ramData.password;
            await user.save();
            console.log('✅ Updated Ram password');
        } else {
            user = await User.create(ramData);
            console.log('✅ Created User: Ram');
        }

        console.log('User Details:', { email: user.email, role: user.role, password: 'User@12345' });
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
