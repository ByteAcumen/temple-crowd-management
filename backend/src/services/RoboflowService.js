const axios = require('axios');
const fs = require('fs');

/**
 * RoboflowService
 * Handles interaction with Roboflow's Computer Vision API
 * Model: crowd-detection-7suou/4
 */
class RoboflowService {
    constructor() {
        // Fallback to the hardcoded key if env var is missing, based on user's snippet
        this.apiKey = process.env.ROBOFLOW_API_KEY || "wsdLXeUN3MmbPrvRMrqF";

        // Use the exact endpoint from the user's snippet
        this.modelEndpoint = "https://serverless.roboflow.com/crowd-detection-7suou/4";

        if (!this.apiKey) {
            console.warn("⚠️ Roboflow API Key is missing! Crowd detection will fail.");
        }
    }

    /**
     * Detect crowd in an image buffer or base64 string
     * @param {Buffer|string} imageInput - Image buffer or Base64 string
     * @returns {Promise<Object>} - { count: number, predictions: Array }
     */
    async detectCrowd(imageInput) {
        try {
            if (!this.apiKey) throw new Error("Roboflow API Key not configured");

            let base64Image = "";

            // Scenario 1: Base64 String
            if (typeof imageInput === 'string') {
                // Ensure it's clean base64 (remove data:image/jpeg;base64, prefix if present)
                base64Image = imageInput.replace(/^data:image\/\w+;base64,/, "");
            }
            // Scenario 2: Binary Buffer
            else if (Buffer.isBuffer(imageInput)) {
                base64Image = imageInput.toString('base64');
            } else {
                throw new Error("Invalid image input type. Expected Buffer or Base64 string.");
            }

            // Using the exact axios POST structure from the Roboflow Docs
            const response = await axios({
                method: "POST",
                url: this.modelEndpoint,
                params: {
                    api_key: this.apiKey,
                    confidence: 40, // Verification threshold
                    overlap: 30,
                    format: "json"
                },
                data: base64Image,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });

            const predictions = response.data.predictions || [];

            const simplifiedPredictions = predictions.map(p => ({
                x: p.x,
                y: p.y,
                width: p.width,
                height: p.height,
                confidence: p.confidence,
                class: p.class
            }));

            // Create Traffic Status based on count
            const count = simplifiedPredictions.length;
            let status = "GREEN";
            if (count > 50) status = "RED";
            else if (count > 20) status = "ORANGE";

            return {
                success: true,
                count: count,
                status: status,
                predictions: simplifiedPredictions,
                raw: response.data
            };

        } catch (error) {
            console.error("❌ Roboflow Detection Error:", error.message);
            if (error.response) {
                console.error("   API Response:", error.response.data);
            }
            return {
                success: false,
                error: error.message,
                count: 0,
                status: "UNKNOWN"
            };
        }
    }
}

module.exports = new RoboflowService();
