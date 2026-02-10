// Using native fetch (Node 18+)
const BASE_URL = 'http://localhost:5000/api/v1';

const USERS = [
    { role: 'Admin', email: 'admin@temple.com', password: 'Admin@123456' },
    { role: 'Gatekeeper', email: 'gatekeeper@temple.com', password: 'Gate@12345' },
    { role: 'Devotee', email: 'user@temple.com', password: 'User@12345' }
];

async function verifyLogins() {
    console.log(`🔍 Verifying Logins at ${BASE_URL}...`);
    let successCount = 0;

    for (const user of USERS) {
        try {
            console.log(`\n🔐 Testing ${user.role} (${user.email})...`);
            const res = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, password: user.password })
            });

            if (res.ok) {
                const data = await res.json();
                console.log(`✅ ${user.role} Login SUCCESS`);
                console.log(`   Token: ${data.token?.substring(0, 15)}...`);
                console.log(`   Role: ${data.user.role}`);
                successCount++;
            } else {
                const text = await res.text();
                console.error(`❌ ${user.role} Login FAILED [${res.status}]: ${text}`);
            }
        } catch (err) {
            console.error(`❌ ${user.role} Error: ${err.message}`);
        }
    }

    console.log('\n-----------------------------------');
    if (successCount === USERS.length) {
        console.log('✨ ALL LOGINS VERIFIED SUCCESSFUL ✨');
    } else {
        console.log(`⚠️  ${successCount}/${USERS.length} Logins Successful`);
    }
}

verifyLogins();
