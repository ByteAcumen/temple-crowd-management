const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';

async function testLogin(email, password, role) {
    console.log(`\nTesting login for ${role} (${email})...`);
    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });

        if (response.data.success) {
            console.log('✅ Login SUCCESS');
            console.log('   Token:', response.data.token ? 'Present' : 'Missing');
            console.log('   User Role:', response.data.user.role);
        }
    } catch (error) {
        console.log('❌ Login FAILED');
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Error:', error.response.data.error);
        } else {
            console.log('   Error:', error.message);
        }
    }
}

async function runTests() {
    await testLogin('admin@temple.com', 'Admin@123456', 'Admin');
    await testLogin('gatekeeper@temple.com', 'Gate@12345', 'Gatekeeper');
}

runTests();
