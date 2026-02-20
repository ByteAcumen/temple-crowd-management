const axios = require('axios'); // Optional if environment supports native fetch
// Using native fetch for simplicity

async function run() {
    const API_URL = 'http://localhost:5001/api/v1';
    const BOOKING_ID = '699340b8cbb00c1a9cc3d5b0'; // ID from previous step

    console.log('1. Logging in...');
    let token;
    try {
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@temple.com',
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        if (!loginData.success) throw new Error('Login failed');
        token = loginData.token;
        console.log('Login successful.');
    } catch (e) {
        console.error('Login error:', e.message);
        process.exit(1);
    }

    // 2. Verify Booking Exists
    console.log(`2. Verifying booking ${BOOKING_ID}...`);
    try {
        const res = await fetch(`${API_URL}/bookings/${BOOKING_ID}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 404) {
            console.error('❌ Booking NOT FOUND after restart! Data loss confirmed.');
            process.exit(1);
        }

        const data = await res.json();
        if (data.success) {
            console.log('✅ Booking PERSISTED after restart!');
            console.log(`Status: ${data.data.status}, User: ${data.data.userName}`);
        } else {
            console.error('❌ Failed to fetch booking:', data);
        }

    } catch (e) {
        console.error('Error fetching booking:', e.message);
        process.exit(1);
    }
}

run();
