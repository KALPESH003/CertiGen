const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false // Security: Do not return password by default in queries
    },
    role: {
        type: String,
        enum: ['user', 'issuer', 'admin'],
        default: 'user'
    },
    organization: {
        type: String,
        default: 'Independent'
    },
    // For issuers who upload their own signature/logo
    signature: {
        type: String, // URL to the uploaded file
        default: 'default-signature.png'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// ==============================================
// 1. Encryption Middleware (Pre-Save Hook)
// ==============================================
// Automatically hash the password before saving to DB
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// ==============================================
// 2. Instance Methods
// ==============================================

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);