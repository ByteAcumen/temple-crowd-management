const mongoose = require('mongoose');
const User = require('../src/models/User');

mongoose.connect('mongodb://127.0.0.1:27017/temple_db')
    .then(async () => {
        console.log('✅ Connected');
        const user = await User.findOne({ email: 'gatekeeper@temple.com' });
        console.log('Gatekeeper:', user);
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
