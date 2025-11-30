const Certificate = require('../models/Certificate');

// ==============================================
// @desc    Verify a Certificate by its Unique ID (Public)
// @route   GET /api/verify/:id
// @access  Public
// ==============================================
exports.verifyCertificate = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 1. Find by the custom 'certificateId' (e.g., CERT-X921...), NOT the MongoDB _id
        const certificate = await Certificate.findOne({ certificateId: id })
            .populate('templateId', 'backgroundUrl layout') // We need visuals to render the preview
            .populate('issuer', 'name organization'); // Show who issued it

        // 2. Security Check: Handle Invalid/Revoked Certificates
        if (!certificate) {
            return res.status(404).json({ 
                success: false, 
                message: 'Invalid Certificate ID. This certificate does not exist.' 
            });
        }

        if (certificate.status === 'Revoked') {
            return res.status(410).json({ 
                success: false, 
                message: 'This certificate has been revoked by the issuing authority.' 
            });
        }

        // 3. Return Public Data
        // We structure this specifically for the Public Verification Page
        res.status(200).json({
            success: true,
            valid: true,
            data: {
                certificateId: certificate.certificateId,
                recipientName: certificate.recipientName,
                courseTitle: certificate.courseTitle,
                issueDate: certificate.issueDate,
                issuedBy: certificate.issuer.organization || certificate.issuer.name,
                // We send the PDF download link here so the UI can show a "Download" button
                downloadUrl: `${process.env.CLIENT_URL}/api/certificates/${certificate._id}/download`
            }
        });

    } catch (err) {
        next(err);
    }
};