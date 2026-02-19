const axios = require('axios');

// Since we are running on same machine/port, we can hit localhost
// Ensure backend is running!
const API_URL = 'http://localhost:5001/api/v1/bot/query';

async function testAgent() {
    console.log("🤖 Testing Smart Agent (from backend)...");

    let sessionId = null;

    // Turn 1: Ask Status
    console.log("\n1. Asking status...");
    try {
        const res1 = await axios.post(API_URL, { query: "What is the status of Somnath?" });
        console.log("Bot Answer:", res1.data.answer);
        sessionId = res1.data.sessionId;
        console.log("Session ID:", sessionId);
    } catch (e) {
        console.error("Error Turn 1:", e.message);
        if (e.response) console.error(e.response.data);
    }

    if (!sessionId) {
        console.error("❌ Failed to get session ID, stopping.");
        return;
    }

    // Turn 2: Close Temple
    console.log("\n2. Closing Temple (Tool Execution)...");
    try {
        const res2 = await axios.post(API_URL, {
            query: "Close Somnath temple due to maintenance.",
            sessionId: sessionId
        });
        console.log("Bot Answer:", res2.data.answer);
    } catch (e) {
        console.error("Error Turn 2:", e.message);
        if (e.response) console.error(e.response.data);
    }

    // Turn 3: Verify Status
    console.log("\n3. Verifying Status...");
    try {
        const res3 = await axios.post(API_URL, {
            query: "Check status of Somnath again.",
            sessionId: sessionId
        });
        console.log("Bot Answer:", res3.data.answer);
    } catch (e) {
        console.error("Error Turn 3:", e.message);
        if (e.response) console.error(e.response.data);
    }
}

testAgent();
