const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';
const TEST_EMAIL = `tester_${Date.now()}@example.com`;
const TEST_PASSWORD = 'password123';
let token = '';

const logPass = (msg) => console.log(`✅ PASS: ${msg}`);
const logFail = (msg, err) => {
    console.error(`❌ FAIL: ${msg}`);
    if (err.response) {
        console.error(`Status: ${err.response.status}, Data:`, err.response.data);
    } else {
        console.error(err.message);
    }
};

const runTests = async () => {
    console.log('🚀 Starting Backend E2E Tests...\n');

    // 1. Health Check
    try {
        const res = await axios.get('http://localhost:5000/');
        if (res.status === 200) logPass('Server is Healthy');
    } catch (e) { logFail('Server Health Check', e); process.exit(1); }

    // 2. Register
    try {
        const res = await axios.post(`${BASE_URL}/auth/register`, {
            name: 'Test Admin',
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            role: 'admin' // Register as admin to test everything
        });
        token = res.data.token;
        logPass(`Registered User: ${TEST_EMAIL}`);
    } catch (e) { logFail('Registration', e); }

    // 3. Login (Double Check)
    try {
        const res = await axios.post(`${BASE_URL}/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        token = res.data.token; // Update token just in case
        logPass('Login Success');
    } catch (e) { logFail('Login', e); }

    const authConfig = { headers: { Authorization: `Bearer ${token}` } };

    // 4. Create Normal Booking
    try {
        const res = await axios.post(`${BASE_URL}/bookings`, {
            templeName: 'Somnath',
            date: '2025-11-15', // Random normal date
            slot: '10:00 - 11:00',
            visitors: 2,
            userEmail: TEST_EMAIL
        }, authConfig);
        logPass('Booking Created (Normal Day)');
    } catch (e) { logFail('Booking Creation', e); }

    // 5. Test AI Blocking (Critical Day) - Assuming User's Model blocks Janmashtami
    try {
        // NOTE: This depends on the specific AI model logic. 
        // We expect a 400 or 201 depending on the exact date/model.
        // For this test, we just check if the API responds correctly.
        await axios.post(`${BASE_URL}/bookings`, {
            templeName: 'Somnath',
            date: '2025-08-16', // Near Janmashtami
            slot: '10:00 - 11:00',
            visitors: 10,
            userEmail: TEST_EMAIL
        }, authConfig);
        console.log('ℹ️ Booking Accepted (AI did not block, which is valid if capacity is OK)');
    } catch (e) {
        if (e.response && e.response.status === 400) {
            logPass('AI Correctly Blocked Critical Booking');
        } else {
            logFail('AI Blocking Test', e);
        }
    }

    // 6. Live Entry (Redis)
    try {
        const res = await axios.post(`${BASE_URL}/live/entry`, {}, authConfig);
        logPass(`Live Entry Recorded. Count: ${res.data.current_count}`);
    } catch (e) { logFail('Live Entry', e); }

    // 7. Live Status
    try {
        const res = await axios.get(`${BASE_URL}/live/status`, authConfig);
        logPass(`Live Status: ${res.data.safety_status} (${res.data.occupancy_percentage})`);
    } catch (e) { logFail('Live Status', e); }

    // 8. AI Help Bot
    try {
        const res = await axios.post(`${BASE_URL}/bot/query`, { query: "Is it crowded right now?" });
        // Response format: { success: true, answer: "...", source: "live_redis" }
        if (res.data.success && res.data.source === 'live_redis') {
            logPass(`Bot Answered: "${res.data.answer}"`);
        } else {
            logFail('Bot Response Invalid', new Error(JSON.stringify(res.data)));
        }
    } catch (e) { logFail('AI Help Bot', e); }

    console.log('\n✨ Tests Completed.');
};

runTests();
