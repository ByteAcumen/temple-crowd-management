const Temple = require('../models/Temple');

/**
 * TEMPLE CONTROLLER
 * 
 * This file contains all the logic for managing temples
 * Think of it as the "command center" for temple operations
 * 
 * Each function handles ONE specific task (create, read, update, delete)
 */

// ==========================================
// 1. CREATE TEMPLE (Admin Only)
// ==========================================
/**
 * @desc    Create a new temple
 * @route   POST /api/v1/temples
 * @access  Private/Admin
 * 
 * WHAT IT DOES:
 * - Admin sends temple data (name, location, capacity)
 * - We save it to MongoDB
 * - Return the created temple
 */
exports.createTemple = async (req, res) => {
    try {
        // Extract data from request body
        const { name, location, capacity, slots, contact, status } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Temple name is required'
            });
        }

        if (!location?.city) {
            return res.status(400).json({
                success: false,
                error: 'City is required'
            });
        }

        if (!capacity?.total) {
            return res.status(400).json({
                success: false,
                error: 'Total capacity is required'
            });
        }

        // Create temple in database
        const temple = await Temple.create({
            name,
            location,
            capacity,
            slots: slots || [],
            contact: contact || {},
            status: status || 'OPEN'
        });

        // Send success response
        res.status(201).json({
            success: true,
            message: 'Temple created successfully',
            data: temple
        });

    } catch (error) {
        // Handle duplicate name error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Temple with this name already exists'
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: messages.join(', ')
            });
        }

        // Generic error
        res.status(500).json({
            success: false,
            error: 'Server error while creating temple'
        });
    }
};

// ==========================================
// 2. GET ALL TEMPLES (Public)
// ==========================================
/**
 * @desc    Get all temples
 * @route   GET /api/v1/temples
 * @access  Public
 * 
 * WHAT IT DOES:
 * - Fetch all temples from database
 * - Can filter by status (e.g., only OPEN temples)
 * - Can filter by city
 * - Returns list with traffic light status for each
 */
exports.getAllTemples = async (req, res) => {
    try {
        // Build filter from query parameters
        const filter = {};

        // Filter by status (e.g., ?status=OPEN)
        if (req.query.status) {
            filter.status = req.query.status;
        }

        // Filter by city (e.g., ?city=Ahmedabad)
        if (req.query.city) {
            filter['location.city'] = new RegExp(req.query.city, 'i'); // Case-insensitive
        }

        // Fetch temples from database
        const temples = await Temple.find(filter).sort({ name: 1 });

        // Add traffic status to each temple (automatically calculated)
        const templesWithStatus = temples.map(temple => ({
            ...temple.toObject(),
            capacity_percentage: temple.capacity_percentage,
            traffic_status: temple.traffic_status
        }));

        res.status(200).json({
            success: true,
            count: temples.length,
            data: templesWithStatus
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching temples'
        });
    }
};

// ==========================================
// 3. GET SINGLE TEMPLE (Public)
// ==========================================
/**
 * @desc    Get single temple by ID
 * @route   GET /api/v1/temples/:id
 * @access  Public
 * 
 * WHAT IT DOES:
 * - Fetch one specific temple
 * - Returns full details including slots, contact, live count
 */
exports.getTemple = async (req, res) => {
    try {
        const temple = await Temple.findById(req.params.id);

        if (!temple) {
            return res.status(404).json({
                success: false,
                error: 'Temple not found'
            });
        }

        // Add virtual properties
        const templeData = {
            ...temple.toObject(),
            capacity_percentage: temple.capacity_percentage,
            traffic_status: temple.traffic_status
        };

        res.status(200).json({
            success: true,
            data: templeData
        });

    } catch (error) {
        // Handle invalid MongoDB ID format
        if (error.name === 'CastError') {
            return res.status(404).json({
                success: false,
                error: 'Temple not found'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error fetching temple'
        });
    }
};

// ==========================================
// 4. UPDATE TEMPLE (Admin Only)
// ==========================================
/**
 * @desc    Update temple
 * @route   PUT /api/v1/temples/:id
 * @access  Private/Admin
 * 
 * WHAT IT DOES:
 * - Admin can update temple details
 * - Cannot update live_count (that's done by gatekeeper scans)
 * - Updates: name, location, capacity, slots, contact, status
 */
exports.updateTemple = async (req, res) => {
    try {
        // Don't allow updating live_count through this endpoint
        delete req.body.live_count;

        const temple = await Temple.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,              // Return updated document
                runValidators: true     // Validate the update
            }
        );

        if (!temple) {
            return res.status(404).json({
                success: false,
                error: 'Temple not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Temple updated successfully',
            data: temple
        });

    } catch (error) {
        // Handle duplicate name error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Temple with this name already exists'
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error updating temple'
        });
    }
};

// ==========================================
// 5. DELETE TEMPLE (Admin Only)
// ==========================================
/**
 * @desc    Delete temple
 * @route   DELETE /api/v1/temples/:id
 * @access  Private/Admin
 * 
 * WHAT IT DOES:
 * - Permanently remove temple from database
 * - WARNING: This also affects all bookings for this temple!
 */
exports.deleteTemple = async (req, res) => {
    try {
        const temple = await Temple.findById(req.params.id);

        if (!temple) {
            return res.status(404).json({
                success: false,
                error: 'Temple not found'
            });
        }

        // Delete the temple
        await temple.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Temple deleted successfully',
            data: {}
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error deleting temple'
        });
    }
};

// ==========================================
// 6. GET TEMPLE LIVE STATUS (Public)
// ==========================================
/**
 * @desc    Get temple live crowd status
 * @route   GET /api/v1/temples/:id/live
 * @access  Public
 * 
 * WHAT IT DOES:
 * - Returns real-time crowd data
 * - Shows: current count, capacity, percentage, traffic light status
 * - Used by dashboards to show "🔴 Temple is 95% full!"
 * 
 * RESPONSE EXAMPLE:
 * {
 *   "temple_name": "Somnath Temple",
 *   "live_count": 9500,
 *   "total_capacity": 10000,
 *   "percentage": "95.0",
 *   "status": "RED"  // or "ORANGE" or "GREEN"
 * }
 */
exports.getTempleLiveStatus = async (req, res) => {
    try {
        const temple = await Temple.findById(req.params.id);

        if (!temple) {
            return res.status(404).json({
                success: false,
                error: 'Temple not found'
            });
        }

        // Calculate percentage and status
        const liveCount = temple.live_count || 0;
        const totalCapacity = temple.capacity.total;
        const percentage = ((liveCount / totalCapacity) * 100).toFixed(1);

        // Determine traffic light status
        let status = 'GREEN';
        if (percentage >= temple.capacity.threshold_critical) {
            status = 'RED';
        } else if (percentage >= temple.capacity.threshold_warning) {
            status = 'ORANGE';
        }

        res.status(200).json({
            success: true,
            data: {
                temple_id: temple._id,
                temple_name: temple.name,
                live_count: liveCount,
                total_capacity: totalCapacity,
                percentage: percentage,
                status: status,
                last_updated: temple.updatedAt
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching live status'
        });
    }
};

/**
 * SUMMARY OF ENDPOINTS:
 * 
 * POST   /api/v1/temples          - Create temple (Admin)
 * GET    /api/v1/temples          - Get all temples (Public)
 * GET    /api/v1/temples/:id      - Get one temple (Public)
 * PUT    /api/v1/temples/:id      - Update temple (Admin)
 * DELETE /api/v1/temples/:id      - Delete temple (Admin)
 * GET    /api/v1/temples/:id/live - Get live status (Public)
 */
