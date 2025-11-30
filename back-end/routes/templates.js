const express = require('express');
const {
    createTemplate,
    getTemplates,
    getTemplate,
    updateTemplate, // Ensure this exists in controller
    deleteTemplate  // Ensure this exists in controller
} = require('../controllers/templateController');

// Middleware
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes here require login
router.use(protect);

router
    .route('/')
    // Any logged in user (Issuer/Admin) can see templates to choose one
    .get(getTemplates)
    // Only Admins can create new templates
    .post(authorize('admin'), createTemplate);

router
    .route('/:id')
    .get(getTemplate)
    // Only Admins can Update (PUT) or Delete (DELETE)
    .put(authorize('admin'), updateTemplate)
    .delete(authorize('admin'), deleteTemplate);

module.exports = router;