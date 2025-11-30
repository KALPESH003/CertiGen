const Certificate = require('../models/Certificate');
const Template = require('../models/Template');

// @desc    Get Dashboard Stats
// @route   GET /api/stats
// @access  Private (Admin)
exports.getDashboardStats = async (req, res, next) => {
    try {
        // Run queries in parallel for performance
        const [totalIssued, totalTemplates] = await Promise.all([
            Certificate.countDocuments({ status: 'Issued' }),
            Template.countDocuments()
        ]);

        // If you had a 'Pending' status, you would count it here. 
        // For now, we return 0 or count actual pending docs if you have them.
        const pendingReview = await Certificate.countDocuments({ status: 'Pending' });

        res.status(200).json({
            success: true,
            data: {
                totalIssued,
                totalTemplates,
                pendingReview
            }
        });
    } catch (err) {
        next(err);
    }
};