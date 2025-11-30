const Certificate = require('../models/Certificate');
const Template = require('../models/Template');
const generateQR = require('../utils/generateQR');
const generatePDF = require('../utils/pdfGenerator');
const sendEmail = require('../utils/sendEmail');

// ==============================================
// @desc    Create a new certificate & Email it
// @route   POST /api/certificates
// @access  Private (Issuer/Admin)
// ==============================================
exports.createCertificate = async (req, res, next) => {
    try {
        console.log("📝 Creating Certificate...");
        const { recipientName, recipientEmail, courseTitle, description, issueDate, templateId } = req.body;

        // 1. Verify Template
        let template;
        if (templateId) {
            template = await Template.findById(templateId);
            if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
        } else {
             // Fallback to default
             template = await Template.findOne({ isDefault: true });
             if (!template) return res.status(400).json({ success: false, message: 'No default template found.' });
        }

        // 2. Create Record in DB
        const certificate = await Certificate.create({
            recipientName,
            recipientEmail,
            courseTitle,
            description,
            issueDate,
            templateId: template._id,
            issuer: req.user.id,
            status: 'Issued'
        });

        console.log(`✅ Certificate Created: ${certificate.certificateId}`);

        // ======================================================
        // 3. Generate PDF & Send Email
        // ======================================================
        try {
            console.log("⚙️ Generating PDF for Email...");
            
            // Generate Assets
            const verificationLink = `${process.env.CLIENT_URL}/verify/${certificate.certificateId}`;
            const qrCodeDataUrl = await generateQR(verificationLink);
            const pdfBuffer = await generatePDF(certificate, template, qrCodeDataUrl);

            // Send Email
            console.log(`📧 Sending email to: ${recipientEmail}`);
            await sendEmail({
                email: recipientEmail,
                subject: `Your Certificate: ${courseTitle}`,
                message: `Dear ${recipientName},\n\nCongratulations! Please find attached your official certificate for "${courseTitle}".\n\nYou can also verify it online here: ${verificationLink}\n\nBest Regards,\nCertiGen Team`,
                pdfBuffer: pdfBuffer,
                filename: `Certificate-${certificate.certificateId}.pdf`
            });

            console.log("✅ Email sent successfully");

        } catch (emailError) {
            // We do NOT stop the request if email fails. 
            // The certificate is valid, just the delivery failed.
            console.error("❌ Email Sending Failed:", emailError.message);
        }
        // ======================================================

        res.status(201).json({
            success: true,
            data: certificate,
            verificationUrl: `${process.env.CLIENT_URL}/verify/${certificate.certificateId}`,
            emailSent: true
        });

    } catch (err) {
        console.error("❌ Create Certificate Error:", err);
        next(err);
    }
};

// ==============================================
// @desc    Get all certificates
// @route   GET /api/certificates
// @access  Private
// ==============================================
exports.getCertificates = async (req, res, next) => {
    try {
        console.log("🔍 Fetching Certificates...");
        
        // 1. Build Query
        const reqQuery = { ...req.query };
        const removeFields = ['select', 'sort', 'page', 'limit'];
        removeFields.forEach(param => delete reqQuery[param]);

        let queryStr = JSON.stringify(reqQuery);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
        
        let searchCriteria = JSON.parse(queryStr);
        
        // 2. Security Check (Admins see all, Issuers see theirs)
        if (!req.user) {
            throw new Error("User context missing in controller. Middleware failed.");
        }

        if (req.user.role !== 'admin') {
            searchCriteria.issuer = req.user.id;
        }

        console.log("Search Criteria:", searchCriteria);

        // 3. Pagination Setup
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Certificate.countDocuments(searchCriteria);

        // 4. Execute Query
        const certificates = await Certificate.find(searchCriteria)
            .populate({ path: 'templateId', select: 'name backgroundUrl' })
            .skip(startIndex)
            .limit(limit)
            .sort({ createdAt: -1 });

        console.log(`✅ Found ${certificates.length} certificates`);

        // 5. Send Response
        res.status(200).json({
            success: true,
            count: certificates.length,
            pagination: {
                next: endIndex < total ? { page: page + 1, limit } : null,
                prev: startIndex > 0 ? { page: page - 1, limit } : null
            },
            data: certificates
        });

    } catch (err) {
        console.error("❌ Get Certificates Error:", err);
        next(err);
    }
};

// ==============================================
// @desc    Get single certificate
// @route   GET /api/certificates/:id
// @access  Private
// ==============================================
exports.getCertificate = async (req, res, next) => {
    try {
        const certificate = await Certificate.findById(req.params.id).populate('templateId');

        if (!certificate) return res.status(404).json({ success: false, message: 'Certificate not found' });

        if (req.user.role !== 'admin' && certificate.issuer.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        res.status(200).json({ success: true, data: certificate });
    } catch (err) {
        next(err);
    }
};

// ==============================================
// @desc    Generate and Stream PDF
// @route   GET /api/certificates/:id/download
// @access  Public
// ==============================================
exports.downloadCertificate = async (req, res, next) => {
    try {
        console.log(`📥 Download Request for ID: ${req.params.id}`);

        const certificate = await Certificate.findById(req.params.id);
        if (!certificate) return res.status(404).json({ success: false, message: 'Certificate not found' });

        const template = await Template.findById(certificate.templateId);
        if (!template) return res.status(404).json({ success: false, message: 'Template missing' });

        // 1. Generate QR & PDF
        const verificationLink = `${process.env.CLIENT_URL}/verify/${certificate.certificateId}`;
        const qrCodeDataUrl = await generateQR(verificationLink);
        
        // Raw Buffer from Puppeteer
        const pdfBuffer = await generatePDF(certificate, template, qrCodeDataUrl);

        // 2. Set Headers for Binary Download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Certificate-${certificate.certificateId}.pdf"`);

        // 3. Send Binary Data safely
        res.end(Buffer.from(pdfBuffer));

        console.log("✅ PDF Sent to Client");

    } catch (err) {
        console.error("❌ Download Controller Error:", err);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: 'PDF Generation failed' });
        }
    }
};

// ==============================================
// @desc    Update certificate details
// @route   PUT /api/certificates/:id
// @access  Private (Issuer/Admin)
// ==============================================
exports.updateCertificate = async (req, res, next) => {
    try {
        console.log(`🔄 Updating Certificate ID: ${req.params.id}`);
        
        let certificate = await Certificate.findById(req.params.id);

        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }

        // Access Control: Only Admin or Owner can edit
        if (req.user.role !== 'admin' && certificate.issuer.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this certificate' });
        }

        certificate = await Certificate.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        console.log(`✅ Certificate Updated`);
        res.status(200).json({ success: true, data: certificate });
    } catch (err) {
        next(err);
    }
};

// ==============================================
// @desc    Delete certificate
// @route   DELETE /api/certificates/:id
// @access  Private (Issuer/Admin)
// ==============================================
exports.deleteCertificate = async (req, res, next) => {
    try {
        console.log(`🗑️ Deleting Certificate ID: ${req.params.id}`);

        const certificate = await Certificate.findById(req.params.id);

        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }

        // Access Control
        if (req.user.role !== 'admin' && certificate.issuer.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this certificate' });
        }

        await certificate.deleteOne();

        console.log(`✅ Certificate Deleted`);
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};