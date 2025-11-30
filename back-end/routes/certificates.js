const express = require('express');
const {
    getCertificates,
    getCertificate,
    createCertificate,
    downloadCertificate,
    updateCertificate, // <<<< Import this
    deleteCertificate  // <<<< Import this
} = require('../controllers/certificateController');

// Middleware for protection
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ==============================================
// Route: /api/certificates
// ==============================================

router
    .route('/')
    // GET: Fetch all certificates (with pagination/filtering)
    // Both Admin and Issuers can view their lists
    .get(protect, getCertificates)
    
    // POST: Create a new certificate
    // Only 'admin' and 'issuer' roles can issue certificates. Regular 'users' cannot.
    .post(protect, authorize('admin', 'issuer'), createCertificate);

// ==============================================
// Route: /api/certificates/:id
// ==============================================

router
    .route('/:id')
    // GET: View details of a specific certificate
    .get(protect, getCertificate)
    // PUT: Update certificate details (Edit)
    .put(protect, updateCertificate)
    // DELETE: Remove certificate (Delete)
    .delete(protect, deleteCertificate);

// ==============================================
// Route: /api/certificates/:id/download
// ==============================================

// GET: Stream the PDF
// We make this PUBLIC so that the QR Code verification page can verify/download 
// without requiring the student/employer to log in. 
router.route('/:id/download').get(downloadCertificate);

module.exports = router;