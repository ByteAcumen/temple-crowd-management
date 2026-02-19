const path = require('path');
const backendPath = path.join(__dirname, '../backend');
const axios = require(path.join(backendPath, 'node_modules', 'axios'));

const API_URL = 'http://localhost:5001/api/v1/bot/query';

async function testAgent() {
    console.log("🤖 Testing Smart Agent...");

    let sessionId = null;

    // Turn 1: Ask Status
    console.log("\n1. Asking status...");
    try {
        const res1 = await axios.post(API_URL, { query: "What is the status of Somnath?" });
        console.log("Bot:", res1.data.answer);
        sessionId = res1.data.sessionId;
        console.log("Session ID:", sessionId);
    } catch (e) { console.error("Error:", e.message); }

    // Turn 2: Close Temple
    console.log("\n2. Closing Temple (Tool Execution)...");
    try {
        const res2 = await axios.post(API_URL, {
            query: "Close Somnath temple due to maintenance.",
            sessionId: sessionId
        });
        console.log("Bot:", res2.data.answer);
    } catch (e) { console.error("Error:", e.message); }

    // Turn 3: Verify Status
    console.log("\n3. Verifying Status...");
    try {
        const res3 = await axios.post(API_URL, {
            query: "Check status of Somnath again.",
            sessionId: sessionId
        });
        console.log("Bot:", res3.data.answer);
    } catch (e) { console.error("Error:", e.message); }
}

testAgent();
