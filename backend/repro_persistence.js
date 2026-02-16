const axios = require('axios'); // You might need to install axios if not present, or use fetch
// Using native fetch for simplicity in Node 18+ environment or assumption
// But the environment might be older. I'll use http/https modules or just simple fetch if available.
// Actually, I'll use a simple node script that I can run with `node`.

async function run() {
    const API_URL = 'http://localhost:5001/api/v1';

    // 1. Login
    console.log('1. Logging in...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@temple.com',
            password: 'password123'
        })
    });

    const loginData = await loginRes.json();
    if (!loginData.success) {
        console.error('Login failed:', loginData);
        process.exit(1);
    }
    const token = loginData.token;
    console.log('Login successful. Token acquired.');

    // 2. Get Temple ID
    console.log('2. Fetching temples...');
    const templeRes = await fetch(`${API_URL}/temples`);
    const templeData = await templeRes.json();
    const temple = templeData.data[0];
    if (!temple) {
        console.error('No temples found');
        process.exit(1);
    }
    console.log(`Using temple: ${temple.name} (${temple._id})`);

    // 3. Create Booking
    console.log('3. Creating booking...');
    const bookingPayload = {
        templeId: temple._id,
        templeName: temple.name,
        date: new Date().toISOString().split('T')[0], // Today
        timeSlot: '10:00-12:00',
        visitors: 1,
        userName: 'Test Admin',
        userEmail: 'admin@temple.com',
        visitorDetails: [{ name: 'Test Visitor', age: 30, gender: 'Male' }]
    };

    const bookingRes = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingPayload)
    });

    const bookingData = await bookingRes.json();
    if (!bookingData.success) {
        console.error('Booking failed:', bookingData);
        process.exit(1);
    }
    const bookingId = bookingData.data._id;
    console.log(`Booking created! ID: ${bookingId}`);

    // 4. Verify in My Bookings
    console.log('4. Verifying in My Bookings...');
    const myBookingsRes = await fetch(`${API_URL}/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const myBookingsData = await myBookingsRes.json();

    const found = myBookingsData.data.find(b => b._id === bookingId);
    if (found) {
        console.log('✅ Booking found in user history!');
        console.log('Booking details:', JSON.stringify(found, null, 2));
    } else {
        console.error('❌ Booking NOT found in user history!');
        process.exit(1);
    }
}

run().catch(console.error);
