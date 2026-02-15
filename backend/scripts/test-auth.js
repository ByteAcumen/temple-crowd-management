const mongoose = require('mongoose');
const User = require('../src/models/User');
const request = require('supertest'); // We don't have supertest installed, so we'll use simple fetch/axios or direct controller testing if possible, but for a script, direct DB + Logic check is better.
// Actually, since this is a standalone script, we can't easily use supertest without the app export. 
// We will test the logic by interacting with the DB and mimicking the controller logic or just using axios against the running server?
// Using axios against the running server is best for an E2E check.

const axios = require('axios');
const API_URL = 'http://localhost:5001/api/v1/auth';

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m'
};

async function testAuth() {
    console.log(`\n${colors.yellow}🔐 STARTING AUTHENTICATION TESTS...${colors.reset}\n`);

    try {
        // 1. REGISTER
        const testUser = {
            name: 'Auth Test User',
            email: `authtest_${Date.now()}@test.com`,
            password: 'Password@123', // Meets complexity requirement
            role: 'user'
        };

        process.stdout.write(`1. Registering new user (${testUser.email})... `);
        try {
            const regRes = await axios.post(`${API_URL}/register`, testUser);
            if (regRes.data.success && regRes.data.token) {
                console.log(`${colors.green}PASSED${colors.reset}`);
            } else {
                throw new Error('No token returned');
            }
        } catch (err) {
            console.log(`${colors.red}FAILED${colors.reset}`);
            console.error(err.response?.data || err.message);
            return; // Stop if register fails
        }

        // 2. LOGIN SUCCESS
        process.stdout.write('2. Login with CORRECT credentials... ');
        try {
            const loginRes = await axios.post(`${API_URL}/login`, {
                email: testUser.email,
                password: 'Password@123'
            });
            if (loginRes.data.success && loginRes.data.token) {
                console.log(`${colors.green}PASSED${colors.reset}`);
            } else {
                throw new Error('No token returned');
            }
        } catch (err) {
            console.log(`${colors.red}FAILED${colors.reset}`);
            console.error(err.response?.data || err.message);
        }

        // 3. LOGIN FACTOR (Wrong Password)
        process.stdout.write('3. Login with WRONG password... ');
        try {
            await axios.post(`${API_URL}/login`, {
                email: testUser.email,
                password: 'wrongpassword'
            });
            console.log(`${colors.red}FAILED${colors.reset} (Should have failed)`);
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 400) {
                console.log(`${colors.green}PASSED${colors.reset} (Correctly rejected)`);
            } else {
                console.log(`${colors.red}FAILED${colors.reset} (Unexpected error: ${err.message})`);
            }
        }

        // 4. LOGIN INVALID EMAIL
        process.stdout.write('4. Login with NON-EXISTENT email... ');
        try {
            await axios.post(`${API_URL}/login`, {
                email: 'nonexistent@test.com',
                password: 'password123'
            });
            console.log(`${colors.red}FAILED${colors.reset} (Should have failed)`);
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 400) {
                console.log(`${colors.green}PASSED${colors.reset} (Correctly rejected)`);
            } else {
                console.log(`${colors.red}FAILED${colors.reset} (Unexpected error: ${err.message})`);
            }
        }

    } catch (err) {
        console.error('\n❌ CRITICAL TEST ERROR:', err.message);
        console.log('Ensure the backend server is running on port 5001');
    } finally {
        console.log(`\n${colors.yellow}🔐 AUTH TESTS COMPLETE${colors.reset}\n`);
    }
}

testAuth();
