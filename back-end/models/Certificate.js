const mongoose = require('mongoose');
const crypto = require('crypto');

const CertificateSchema = new mongoose.Schema({
    // The unique, human-readable ID for verification (e.g., printed on the PDF)
    certificateId: {
        type: String,
        unique: true,
        index: true // Indexed for instant verification lookups
    },
    recipientName: {
        type: String,
        required: [true, 'Please add recipient name']
    },
    recipientEmail: {
        type: String,
        required: [true, 'Please add recipient email'],
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    courseTitle: {
        type: String,
        required: [true, 'Please add course/event title']
    },
    description: {
        type: String,
        default: 'For successfully completing the requirements.'
    },
    issueDate: {
        type: Date,
        default: Date.now
    },
    // Relationship: Which admin/issuer created this?
    issuer: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    // Relationship: Which visual template was used?
    templateId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Template',
        required: false // Optional: fall back to default if null
    },
    // The Generated PDF URL (stored after generation)
    pdfUrl: {
        type: String
    },
    // Status management (Real-world compliance feature)
    status: {
        type: String,
        enum: ['Issued', 'Revoked'],
        default: 'Issued'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// ==============================================
// 1. ID Generation Logic (Pre-Validate Hook)
// ==============================================
// We generate the ID *before* validation to ensure it exists.
CertificateSchema.pre('validate', function(next) {
    if (!this.certificateId) {
        // Generate a random 12-char string: 3f82a9...
        const randomStr = crypto.randomBytes(6).toString('hex').toUpperCase();
        // Format it nicely: CERT-XXXX-XXXX
        this.certificateId = `CERT-${randomStr.substring(0, 4)}-${randomStr.substring(4, 8)}-${randomStr.substring(8, 12)}`;
    }
    next();
});

module.exports = mongoose.model('Certificate', CertificateSchema);