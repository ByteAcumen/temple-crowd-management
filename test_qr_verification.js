// Quick QR Verification Flow Test
// Tests: Create Booking → Get by PassID → Verify Entry/Exit

const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';

async function test() {
    try {
        console.log('🧪 Testing QR Verification Flow...\n');

        // Step 1: Register/Login as User
        console.log('1️⃣ Logging in as user...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'user@temple.com',
            password: 'User@123456'
        });
        const userToken = loginRes.data.token;
        console.log('✅ User logged in');

        // Step 2: Get temples
        console.log('\n2️⃣ Fetching temples...');
        const templesRes = await axios.get(`${API_URL}/temples`);
        const temple = templesRes.data.data[0];
        console.log(`✅ Found temple: ${temple.name} (ID: ${temple._id})`);

        // Step 3: Create booking
        console.log('\n3️⃣ Creating booking...');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const bookingRes = await axios.post(`${API_URL}/bookings`, {
            templeId: temple._id,
            templeName: temple.name,
            date: tomorrow.toISOString().split('T')[0],
            timeSlot: '09:00-10:00',
            visitors: 2,
            userName: 'Test User',
            userEmail: 'user@temple.com'
        }, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        const booking = bookingRes.data.data;
        console.log(`✅ Booking created: ${booking.passId}`);
        console.log(`   Status: ${booking.status}`);

        // Step 4: Fetch booking by passId (PUBLIC endpoint - no auth needed)
        console.log(`\n4️⃣ Fetching booking by passId (${booking.passId})...`);
        const passRes = await axios.get(`${API_URL}/bookings/pass/${booking.passId}`);
        console.log('✅ Booking retrieved successfully');
        console.log(`   Temple: ${typeof passRes.data.data.temple === 'object' ? passRes.data.data.temple.name : passRes.data.data.temple}`);
        console.log(`   Status: ${passRes.data.data.status}`);

        // Step 5: Login as Gatekeeper
        console.log('\n5️⃣ Logging in as gatekeeper...');
        const gkLoginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'gatekeeper@temple.com',
            password: 'Gatekeeper@123'
        });
        const gkToken = gkLoginRes.data.token;
        console.log('✅ Gatekeeper logged in');

        // Step 6: Record Entry
        console.log('\n6️⃣ Recording entry...');
        const entryRes = await axios.post(`${API_URL}/live/entry`, {
            templeId: temple._id,
            passId: booking.passId
        }, {
            headers: { Authorization: `Bearer ${gkToken}` }
        });
        console.log('✅ Entry recorded successfully');
        console.log(`   Live Count: ${entryRes.data.data.temple.live_count}`);
        console.log(`   Status: ${entryRes.data.data.temple.traffic_status}`);

        // Step 7: Record Exit
        console.log('\n7️⃣ Recording exit...');
        const exitRes = await axios.post(`${API_URL}/live/exit`, {
            templeId: temple._id,
            passId: booking.passId
        }, {
            headers: { Authorization: `Bearer ${gkToken}` }
        });
        console.log('✅ Exit recorded successfully');
        console.log(`   Live Count: ${exitRes.data.data.temple.live_count}`);

        console.log('\n✅ ALL TESTS PASSED! Verification flow works correctly.');

    } catch (error) {
        console.error('\n❌ TEST FAILED:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Error: ${error.response.data.error || error.response.data}`);
        } else {
            console.error(`   ${error.message}`);
        }
        process.exit(1);
    }
}

test();
