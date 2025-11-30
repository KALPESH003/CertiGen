const express = require('express');
const {
    register,
    login,
    getMe,
    logout
} = require('../controllers/authController');

// Import Middleware to protect the /me route
const { protect } = require('../middleware/auth');

const router = express.Router();

// ==============================================
// Public Routes
// ==============================================

// POST /api/auth/register
// Registers a new user (Admin or Issuer)
router.post('/register', register);

// POST /api/auth/login
// Authenticates user and sets the HttpOnly cookie
router.post('/login', login);

// GET /api/auth/logout
// Clears the cookie
router.get('/logout', logout);

// ==============================================
// Protected Routes
// ==============================================

// GET /api/auth/me
// Returns the currently logged-in user's data
// Used by the Frontend (React/Vue) to persist state on page reload
router.get('/me', protect, getMe);

module.exports = router;