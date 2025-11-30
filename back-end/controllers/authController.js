const User = require('../models/User');

// ==============================================
// Helper: Get Token from Model, Create Cookie & Send Response
// ==============================================
const sendTokenResponse = (user, statusCode, res) => {
    // Create token using the method we defined in User.js model
    const token = user.getSignedJwtToken();

    // Determine cookie settings based on environment
    // In Development (Localhost), we need Secure: false and SameSite: Lax
    // In Production (Render/Heroku), we need Secure: true and SameSite: None
    const isProduction = process.env.NODE_ENV === 'production';

    const options = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,     // Security: JS cannot read this cookie (Prevents XSS)
        secure: isProduction, // False on localhost, True on HTTPS
        sameSite: isProduction ? 'none' : 'lax' // Lax allows localhost navigation
    };

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token, // We send it in body too, just in case the frontend prefers Bearer tokens
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organization: user.organization
            }
        });
};

// ==============================================
// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
// ==============================================
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, organization } = req.body;

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            organization
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        // Handle Duplicate Key Error (E11000) for Email
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        next(err);
    }
};

// ==============================================
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ==============================================
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an email and password' });
        }

        // Check for user
        // We must explicitly .select('+password') because we set select:false in the model
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// ==============================================
// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
// ==============================================
exports.getMe = async (req, res, next) => {
    try {
        // user is already available in req due to the 'protect' middleware
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// ==============================================
// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
// ==============================================
exports.logout = async (req, res, next) => {
    const isProduction = process.env.NODE_ENV === 'production';

    // We clear the cookie by setting it to a date in the past
    // Note: Options must match the creation options for deletion to work!
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax'
    });

    res.status(200).json({
        success: true,
        data: {}
    });
};