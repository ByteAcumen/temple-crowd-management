const RoboflowService = require('../services/RoboflowService');

/**
 * Vision Controller
 * Handles image analysis requests
 */
exports.analyzeCrowd = async (req, res) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({
                success: false,
                error: "Image data is required (Base64 string)"
            });
        }

        // Call the Roboflow Service
        // Note: In production, we might want to cache this or rate limit usage 
        // to avoid hitting API limits too quickly.

        console.log("📸 Vision API: Analyzing image...");
        const result = await RoboflowService.detectCrowd(image);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: result.error
            });
        }

        res.json({
            success: true,
            data: {
                count: result.count,
                status: result.status,
                predictions: result.predictions
            }
        });

    } catch (error) {
        console.error("❌ Vision API Error:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error"
        });
    }
};
