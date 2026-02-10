const axios = require('axios');

const API_URL = 'http://localhost:5001/api/v1';

async function verifyScanner() {
    try {
        console.log('🚀 Starting Scanner Verification...');

        // 1. Login (or Register if needed)
        let token;
        let user;
        try {
            console.log('🔑 Logging in as admin...');
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: 'admin@temple.com',
                password: 'Admin@123'
            });
            token = loginRes.data.token;
            user = loginRes.data.user;
            console.log('✅ Login successful:', user.name);
        } catch (e) {
            console.log('⚠️ Login failed, trying to register new admin...');
            try {
                const regRes = await axios.post(`${API_URL}/auth/register`, {
                    name: 'Test Admin',
                    email: `admin_${Date.now()}@test.com`,
                    password: 'Admin@123',
                    role: 'admin'
                });
                token = regRes.data.token;
                user = regRes.data.user;
                console.log('✅ Registration successful:', user.name);
            } catch (regError) {
                console.error('❌ Authentication failed:', regError.response?.data || regError.message);
                return;
            }
        }

        const authHeader = { headers: { Authorization: `Bearer ${token}` } };

        // 2. Get Temples
        console.log('🛕 Fetching temples...');
        const templesRes = await axios.get(`${API_URL}/temples`, authHeader);
        const temple = templesRes.data.data[0];
        if (!temple) {
            console.error('❌ No temples found');
            return;
        }
        console.log('✅ Selected Temple:', temple.name);

        // 3. Create Booking
        console.log('🎫 Creating booking...');
        const bookingData = {
            templeId: temple._id,
            date: new Date().toISOString().split('T')[0],
            slot: "10:00 - 11:00",
            visitors: 2,
            templeName: temple.name
        };

        try {
            // Create booking
            const bookRes = await axios.post(`${API_URL}/bookings`, bookingData, authHeader);
            const booking = bookRes.data.data;
            console.log('✅ Booking created. Pass ID:', booking.passId);

            // 4. Simulate Scan (Get Booking by Pass ID)
            console.log('🔍 Simulating Scan (Get By Pass ID)...');
            const scanRes = await axios.get(`${API_URL}/bookings/pass/${booking.passId}`, authHeader);
            if (scanRes.data.success) {
                console.log('✅ Scan Validated: Booking found');
            } else {
                console.error('❌ Scan Validation Failed:', scanRes.data);
            }

            // 5. Simulate Entry
            console.log('🟢 Simulating Entry...');
            try {
                const entryRes = await axios.post(`${API_URL}/live/entry`, {
                    templeId: temple._id,
                    passId: booking.passId
                }, authHeader);
                console.log('✅ Entry Recorded:', entryRes.data.message);
            } catch (entryError) {
                console.error('❌ Entry Failed:', entryError.response?.data || entryError.message);
            }

            // 6. Simulate Exit
            console.log('🔴 Simulating Exit...');
            try {
                const exitRes = await axios.post(`${API_URL}/live/exit`, {
                    templeId: temple._id,
                    passId: booking.passId
                }, authHeader);
                console.log('✅ Exit Recorded:', exitRes.data.message);
            } catch (exitError) {
                console.error('❌ Exit Failed:', exitError.response?.data || exitError.message);
            }

            console.log('🎉 Verification Complete!');

        } catch (bookingError) {
            console.error('❌ Booking Flow Failed:', bookingError.response?.data || bookingError.message);
            // If booking failed because of closed temple, try to force open it?
            // Since we are admin we might be able to update it, but let's just report execution failure first.
        }

    } catch (error) {
        console.error('❌ Verification Error:', error.message);
    }
}

verifyScanner();
