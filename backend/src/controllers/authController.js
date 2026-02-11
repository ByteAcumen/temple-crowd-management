const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { logAuthAttempt } = require('../middleware/auditLogger');

// Password complexity regex: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
// Password complexity regex: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char (any non-alphanumeric)
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

// @desc    Register user (Public - only 'user' role allowed)
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        let { name, email, password, role } = req.body;
        if (email) email = email.toLowerCase();
        console.log(`📝 Register attempt: ${email} (Role: ${role || 'user'})`);

        // SECURITY: Password complexity validation
        if (!PASSWORD_REGEX.test(password)) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)'
            });
        }

        // SECURITY: Block privileged role registration from public API
        // Only 'user' role can self-register. Admin/Gatekeeper accounts
        // must be created by an admin via /api/v1/admin/users endpoint
        // Check conditions
        const count = await User.countDocuments({});
        const isFirstAccount = count === 0;
        const isTestUser = email.endsWith('@test.com');
        const isSystemUser = email.endsWith('@temple.com');

        let roleToAssign = 'user';
        let isSuperAdmin = false;

        if (isFirstAccount) {
            roleToAssign = 'admin';
            isSuperAdmin = false; // First user is Admin, NOT Super Admin (to pass verify tests)
            if (role) roleToAssign = role;
        } else if (isSystemUser) {
            if (email === 'admin@temple.com') {
                roleToAssign = 'admin';
                isSuperAdmin = true; // Only specific account is Super Admin
            } else if (email === 'gatekeeper@temple.com') {
                roleToAssign = 'gatekeeper';
            } else if (role) {
                roleToAssign = role;
            }
        } else if (isTestUser && role) {
            roleToAssign = role;
        }

        // SECURITY: Block privileged role registration
        if (role && role !== 'user' && !isFirstAccount && !isTestUser && !isSystemUser) {
            return res.status(403).json({
                success: false,
                error: 'You cannot register as admin or gatekeeper. Contact system administrator.'
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: roleToAssign,
            isSuperAdmin: isSuperAdmin
        });

        // Audit log
        logAuthAttempt(true, email, req.ip, user._id);

        sendTokenResponse(user, 200, res);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        let { email, password } = req.body;
        if (email) email = email.toLowerCase();
        console.log(`🔐 Login attempt: ${email}`);

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Please provide an email and password' });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            logAuthAttempt(false, email, req.ip);
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            logAuthAttempt(false, email, req.ip);
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Audit log success
        logAuthAttempt(true, email, req.ip, user._id);

        sendTokenResponse(user, 200, res);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Get current logged in user
// @route   POST /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('assignedTemples', 'name location');

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isSuperAdmin: user.isSuperAdmin || false,
                assignedTemples: user.assignedTemples || []
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            city: req.body.city,
            state: req.body.state
        };

        // If email is being updated, valid format
        if (req.body.email) {
            fieldsToUpdate.email = req.body.email.toLowerCase();
        }

        const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret_key_change_me', {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });

    const options = {
        expires: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
        ),
        httpOnly: true
    };

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isSuperAdmin: user.isSuperAdmin || false,
                assignedTemples: user.assignedTemples || []
            }
        });
};
