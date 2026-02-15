const axios = require('axios');

const API_URL = 'http://localhost:5001/api/v1';
const ML_DETECTION_URL = 'http://localhost:8001';
const ML_FORECASTING_URL = 'http://localhost:8002';

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

// Helper to print step
const step = (msg) => process.stdout.write(`${colors.cyan}➤ ${msg}... ${colors.reset}`);
const pass = () => console.log(`${colors.green}PASSED${colors.reset}`);
const fail = (err) => {
    console.log(`${colors.red}FAILED${colors.reset}`);
    if (err.response) {
        console.error(`  Status: ${err.response.status}`);
        console.error(`  Data:`, JSON.stringify(err.response.data, null, 2));
    } else {
        console.error(`  Error: ${err.message}`);
    }
};

async function runE2ETest() {
    console.log(`\n${colors.yellow}🚀 STARTING END-TO-END (E2E) SYSTEM TEST${colors.reset}\n`);

    try {
        // --- 1. HEALTH CHECKS ---
        console.log(`${colors.yellow}--- PHASE 1: SYSTEM HEALTH ---${colors.reset}`);

        step('Backend API Health');
        await axios.get(`${API_URL}/health`);
        pass();

        step('ML Crowd Detection Service (YOLOv8)');
        try {
            await axios.get(`${ML_DETECTION_URL}/health`);
            pass();
        } catch (e) {
            console.log(`${colors.red}FAILED${colors.reset} (Is Docker container running?)`);
        }

        step('ML Demand Forecasting Service (LSTM)');
        try {
            await axios.get(`${ML_FORECASTING_URL}/health`);
            pass();
        } catch (e) {
            console.log(`${colors.red}FAILED${colors.reset} (Is Docker container running?)`);
        }

        // --- 2. USER FLOWS ---
        console.log(`\n${colors.yellow}--- PHASE 2: USER & BOOKING FLOWS ---${colors.reset}`);

        // Setup Users
        const userA = { name: 'E2E User A', email: `e2e_a_${Date.now()}@test.com`, password: 'Password@123', role: 'user' };
        const userB = { name: 'E2E User B', email: `e2e_b_${Date.now()}@test.com`, password: 'Password@123', role: 'user' };
        const gatekeeper = { email: 'gatekeeper@temple.com', password: 'Gate@12345' }; // Use seeded gatekeeper

        // Register User A
        step(`Registering User A (${userA.email})`);
        let res = await axios.post(`${API_URL}/auth/register`, userA);
        const tokenA = res.data.token;
        pass();

        // Register User B
        step(`Registering User B (${userB.email})`);
        res = await axios.post(`${API_URL}/auth/register`, userB);
        const tokenB = res.data.token;
        pass();

        // Login Gatekeeper
        step('Logging in Gatekeeper');
        res = await axios.post(`${API_URL}/auth/login`, gatekeeper);
        const tokenGK = res.data.token;
        pass();

        // Get Temples (to book)
        step('Fetching Temples');
        res = await axios.get(`${API_URL}/temples`);
        const temple = res.data.data[0];
        if (!temple) throw new Error('No temples found. Seed database first.');
        console.log(` (ID: ${temple._id})`);
        pass();

        // User A Books Ticket
        step('User A Creating Booking');
        res = await axios.post(`${API_URL}/bookings`, {
            templeId: temple._id, // CORRECTED PARAMETER
            templeName: temple.name,
            date: new Date().toISOString(),
            slot: '10:00 AM',
            visitors: 2,
            visitorDetails: [
                { name: 'A1', age: 30, gender: 'Male' },
                { name: 'A2', age: 28, gender: 'Female' }
            ]
        }, { headers: { Authorization: `Bearer ${tokenA}` } });
        const bookingA = res.data.data;
        pass();

        // User B Books Ticket
        step('User B Creating Booking');
        res = await axios.post(`${API_URL}/bookings`, {
            templeId: temple._id, // CORRECTED PARAMETER
            templeName: temple.name,
            date: new Date().toISOString(),
            slot: '11:00 AM',
            visitors: 1,
            visitorDetails: [
                { name: 'B1', age: 25, gender: 'Male' }
            ]
        }, { headers: { Authorization: `Bearer ${tokenB}` } });
        const bookingB = res.data.data;
        pass();

        // --- 3. VERIFICATION FLOWS ---
        console.log(`\n${colors.yellow}--- PHASE 3: GATEKEEPER VERIFICATION ---${colors.reset}`);

        // Verify User A's Ticket
        step(`Gatekeeper Verifying User A's Pass (${bookingA.passId})`);
        res = await axios.get(`${API_URL}/bookings/pass/${bookingA.passId}`, {
            headers: { Authorization: `Bearer ${tokenGK}` }
        });
        if (res.data.data.status === 'CONFIRMED') {
            pass();
        } else {
            console.log(`${colors.red}FAILED${colors.reset} (Status: ${res.data.data.status})`);
        }

        // Verify User B's Ticket
        step(`Gatekeeper Verifying User B's Pass (${bookingB.passId})`);
        res = await axios.get(`${API_URL}/bookings/pass/${bookingB.passId}`, {
            headers: { Authorization: `Bearer ${tokenGK}` }
        });
        if (res.data.data.status === 'CONFIRMED') {
            pass();
        } else {
            console.log(`${colors.red}FAILED${colors.reset} (Status: ${res.data.data.status})`);
        }

        // ISOLATION CHECK AGAIN (Double Check)
        step('Isolation Check: User A trying to fetch User B\'s booking by ID');
        try {
            await axios.get(`${API_URL}/bookings/${bookingB._id}`, {
                headers: { Authorization: `Bearer ${tokenA}` }
            });
            console.log(`${colors.red}FAILED${colors.reset} (User A could access User B's booking!)`);
        } catch (e) {
            if (e.response && e.response.status === 403) { // 403 Forbidden is expected
                pass();
            } else {
                console.log(`${colors.red}FAILED${colors.reset} (Unexpected error: ${e.message})`);
            }
        }

    } catch (err) {
        console.error('\n❌ E2E TEST CRITICAL FAILURE');
        fail(err);
    } finally {
        console.log(`\n${colors.yellow}🏁 E2E TEST RUN COMPLETE${colors.reset}\n`);
    }
}

runE2ETest();
