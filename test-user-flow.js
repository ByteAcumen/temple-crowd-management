const API_URL = 'http://localhost:5000/api/v1';

async function testUserFlow() {
    console.log('🧪 Testing User Registration & Login Flow...');

    const testUser = {
        name: 'Test Devotee',
        email: `devotee_${Date.now()}@test.com`, // Unique email
        password: 'User@12345',
        role: 'user'
    };

    try {
        // 1. Register
        console.log(`\n1. Registering ${testUser.email}...`);
        const regRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });
        const regData = await regRes.json();

        if (regRes.ok && regData.success) {
            console.log('   ✅ Registration SUCCESS');
            console.log('   Token received:', !!regData.token);
        } else {
            console.log('   ❌ Registration FAILED');
            console.log('   Error:', regData.error);
            return;
        }

        // 2. Login
        console.log(`\n2. Logging in as ${testUser.email}...`);
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testUser.email,
                password: testUser.password
            })
        });
        const loginData = await loginRes.json();

        if (loginRes.ok && loginData.success) {
            console.log('   ✅ Login SUCCESS');
            console.log('   User Role:', loginData.user.role);
        } else {
            console.log('   ❌ Login FAILED');
            console.log('   Error:', loginData.error);
        }

    } catch (error) {
        console.log('❌ Flow FAILED');
        console.log('   Error:', error.message);
    }
}

testUserFlow();
