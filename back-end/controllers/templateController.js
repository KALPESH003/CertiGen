const Template = require('../models/Template');

// ==============================================
// @desc    Create a new Certificate Template
// @route   POST /api/templates
// @access  Private (Admin only)
// ==============================================
exports.createTemplate = async (req, res, next) => {
    try {
        const { name, backgroundUrl, layout, isDefault } = req.body;

        // 1. Check for Duplicate Name
        const existingTemplate = await Template.findOne({ name });
        if (existingTemplate) {
            return res.status(400).json({ success: false, message: 'Template with this name already exists' });
        }

        // 2. CRITICAL: If setting as Default, unset previous Default
        if (isDefault) {
            await Template.updateMany({}, { isDefault: false });
        }

        const template = await Template.create({
            name,
            backgroundUrl,
            layout,
            isDefault,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            data: template
        });

    } catch (err) {
        next(err);
    }
};

// ==============================================
// @desc    Get all templates
// @route   GET /api/templates
// @access  Private (Admin & Issuer)
// ==============================================
exports.getTemplates = async (req, res, next) => {
    try {
        const templates = await Template.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: templates.length,
            data: templates
        });
    } catch (err) {
        next(err);
    }
};

// ==============================================
// @desc    Get single template details
// @route   GET /api/templates/:id
// @access  Private
// ==============================================
exports.getTemplate = async (req, res, next) => {
    try {
        const template = await Template.findById(req.params.id);

        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }

        res.status(200).json({
            success: true,
            data: template
        });
    } catch (err) {
        next(err);
    }
};

// ==============================================
// @desc    Update template (e.g. adjust layout)
// @route   PUT /api/templates/:id
// @access  Private (Admin only)
// ==============================================
exports.updateTemplate = async (req, res, next) => {
    try {
        let template = await Template.findById(req.params.id);

        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }

        // 1. CRITICAL: If setting as Default, unset previous Defaults (excluding this one)
        if (req.body.isDefault) {
            await Template.updateMany({ _id: { $ne: req.params.id } }, { isDefault: false });
        }

        // 2. Update fields
        template = await Template.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: template
        });
    } catch (err) {
        next(err);
    }
};

// ==============================================
// @desc    Delete template
// @route   DELETE /api/templates/:id
// @access  Private (Admin only)
// ==============================================
exports.deleteTemplate = async (req, res, next) => {
    try {
        const template = await Template.findById(req.params.id);

        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }

        await template.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};