// using native fetch
// If node-fetch isn't available, we can use http/https modules, but native fetch is in Node 18+

const BASE_URL = 'http://127.0.0.1:5000/api/v1';

async function testAPI() {
    try {
        console.log(`📡 Testing API at ${BASE_URL}...`);

        // 1. Login
        console.log('\n🔐 Attempting Login...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@temple.com', password: 'admin123' })
        });

        if (!loginRes.ok) {
            const text = await loginRes.text();
            console.error(`❌ Login Failed [${loginRes.status}]:`, text.substring(0, 100)); // Log first 100 chars
            return;
        }
        console.log('✅ Login Successful');
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('🔑 Token:', token.substring(0, 20) + '...');

        // 2. Get Temples
        console.log('\n🛕 Fetching Temples...');
        const templesRes = await fetch(`${BASE_URL}/temples`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const templesData = await templesRes.json();
        console.log(`Status: ${templesRes.status}`);
        if (templesRes.ok) {
            console.log(`✅ Temples Found: ${templesData.count || templesData.data?.length || 0}`);
            // console.log(JSON.stringify(templesData, null, 2));
        } else {
            console.error('❌ Fetch Temples Failed:', templesData);
        }

        // 3. Get Admin Stats
        console.log('\n📊 Fetching Admin Stats...');
        const statsRes = await fetch(`${BASE_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const statsData = await statsRes.json();
        console.log(`Status: ${statsRes.status}`);
        if (statsRes.ok) {
            console.log('✅ Stats Received:', JSON.stringify(statsData.data?.overview || statsData, null, 2));
        } else {
            console.error('❌ Fetch Stats Failed:', statsData);
        }

    } catch (err) {
        console.error('❌ Unexpected Error:', err.message);
    }
}

testAPI();
