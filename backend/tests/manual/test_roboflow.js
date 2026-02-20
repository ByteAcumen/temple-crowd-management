const path = require('path');
const fs = require('fs');

// Resolve path to backend
const backendPath = path.join(__dirname, '../backend');

// Load environment variables manually for the test script
const dotenv = require(path.join(backendPath, 'node_modules', 'dotenv'));
dotenv.config({ path: path.join(backendPath, '.env') });

if (!process.env.ROBOFLOW_API_KEY) {
    console.error("❌ ROBOFLOW_API_KEY not found in backend/.env");
    process.exit(1);
}

// Import Service
const RoboflowService = require(path.join(backendPath, 'src/services/RoboflowService.js'));

// Test Image Path (Use temple-hero.png as a test case)
const imagePath = path.join(__dirname, '../frontend/public/temple-hero.png');

if (!fs.existsSync(imagePath)) {
    console.error(`❌ Test image not found at: ${imagePath}`);
    process.exit(1);
}

const runTest = async () => {
    console.log(`🔍 Testing Crowd Detection on: ${path.basename(imagePath)}`);
    console.log(`🔑 Using API Key: ${process.env.ROBOFLOW_API_KEY.substring(0, 5)}...`);

    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    console.log("🚀 Sending request to Roboflow...");
    const result = await RoboflowService.detectCrowd(base64Image);

    if (result.success) {
        console.log("✅ Detection Successful!");
        console.log(`👥 Count: ${result.count}`);
        console.log(`🚦 Status: ${result.status}`);
        if (result.predictions.length > 0) {
            console.log("📝 Sample Prediction:", result.predictions[0]);
        }
    } else {
        console.error("❌ Detection Failed:", result.error);
    }
};

runTest();
