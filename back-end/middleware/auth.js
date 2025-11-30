const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ==============================================
// 1. Protect Middleware (The Gatekeeper)
// ==============================================
// Verifies the token and injects user data into the request object
exports.protect = async (req, res, next) => {
    let token;

    // Strategy 1: Check Authorization Header (Bearer Token)
    // Common for Mobile Apps or API-only clients
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }
    // Strategy 2: Check Cookies
    // Secure approach for Web Browsers (matches our authController logic)
    else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Not authorized to access this route' 
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch the user associated with the token
        // We attach it to req.user so subsequent controllers can access it
        req.user = await User.findById(decoded.id);

        if (!req.user) {
             return res.status(401).json({ 
                success: false, 
                message: 'User belonging to this token no longer exists' 
            });
        }

        next();
    } catch (err) {
        return res.status(401).json({ 
            success: false, 
            message: 'Not authorized to access this route' 
        });
    }
};

// ==============================================
// 2. Authorize Middleware (The Permission Check)
// ==============================================
// Accepts a list of allowed roles (e.g. 'admin', 'issuer')
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `User role '${req.user.role}' is not authorized to access this route` 
            });
        }
        next();
    };
};