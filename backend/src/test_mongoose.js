const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const { v4: uuidv4 } = require('uuid');

async function test() {
    console.log('UUIDv4 test:', uuidv4());

    try {
        const doc = new Booking({
            temple: new mongoose.Types.ObjectId(),
            templeName: 'Test Temple',
            date: new Date(),
            slot: '10:00 AM',
            visitors: 1,
            userEmail: 'test@test.com'
        });

        console.log('Doc before validate:', doc);

        await doc.validate();
        console.log('Validation passed!');
    } catch (err) {
        console.error('Validation error:', err);
    }
}

test();
