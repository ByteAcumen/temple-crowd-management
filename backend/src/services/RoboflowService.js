const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

/**
 * RoboflowService
 * Handles interaction with Roboflow's Computer Vision API
 * Model: crowd-detection-all-videos/2
 */
class RoboflowService {
    constructor() {
        this.apiKey = process.env.ROBOFLOW_API_KEY;
        this.modelEndpoint = "https://detect.roboflow.com/crowd-detection-all-videos/2"; // Using the detect endpoint for better JSON response
        // Alternate: https://serverless.roboflow.com/crowd-detection-all-videos/2

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

            // Prepare headers
            const params = {
                api_key: this.apiKey,
                confidence: 40, // Verification threshold
                overlap: 30,
                format: "json"
            };

            let response;

            // Scenario 1: Base64 String
            if (typeof imageInput === 'string') {
                // Ensure it's clean base64 (remove data:image/jpeg;base64, prefix if present)
                const base64Image = imageInput.replace(/^data:image\/\w+;base64,/, "");

                response = await axios({
                    method: "POST",
                    url: this.modelEndpoint,
                    params: params,
                    data: base64Image,
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                });
            }
            // Scenario 2: Binary Buffer
            else if (Buffer.isBuffer(imageInput)) {
                // For binary, we send as form data or base64 encoded
                const base64Image = imageInput.toString('base64');
                response = await axios({
                    method: "POST",
                    url: this.modelEndpoint,
                    params: params,
                    data: base64Image,
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                });
            } else {
                throw new Error("Invalid image input type. Expected Buffer or Base64 string.");
            }

            const predictions = response.data.predictions || [];

            // Filter specifically for "person" class if model returns multiple classes, 
            // but this specific model is trained on crowd so likely all are people.
            // We can map it to a simpler format for our frontend.

            const simplifiedPredictions = predictions.map(p => ({
                x: p.x,
                y: p.y,
                width: p.width,
                height: p.height,
                confidence: p.confidence,
                class: p.class
            }));

            // Create Traffic Status based on count (Mock logic for now, can be tuned)
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
