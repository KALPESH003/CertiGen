const express = require('express');
const { verifyCertificate } = require('../controllers/verifyController');

const router = express.Router();

// ==============================================
// Route: /api/verify/:id
// ==============================================

// Public Route - No 'protect' middleware here.
// Anyone with the QR code can access this.
router.get('/:id', verifyCertificate);

module.exports = router;