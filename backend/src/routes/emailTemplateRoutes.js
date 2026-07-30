const express = require('express');
const router = express.Router();
const emailTemplateController = require('../controllers/emailTemplateController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Validation middleware
const { body } = require('express-validator');

// Get all templates (admin only)
router.get('/', authenticate, isAdmin, emailTemplateController.getAllTemplates);

// Get template by type (admin only)
router.get('/type/:template_type', authenticate, isAdmin, emailTemplateController.getTemplateByType);

// Get template by ID (admin only)
router.get('/:id', authenticate, isAdmin, emailTemplateController.getTemplateById);

// Create template (admin only)
router.post('/', 
    authenticate, 
    isAdmin,
    [
        body('template_type').notEmpty().withMessage('Template type is required'),
        body('template_name').notEmpty().withMessage('Template name is required'),
        body('subject').notEmpty().withMessage('Subject is required'),
        body('html_body').notEmpty().withMessage('HTML body is required')
    ],
    emailTemplateController.createTemplate
);

// Update template (admin only)
router.put('/:id',
    authenticate,
    isAdmin,
    [
        body('template_type').optional().notEmpty(),
        body('template_name').optional().notEmpty(),
        body('subject').optional().notEmpty(),
        body('html_body').optional().notEmpty()
    ],
    emailTemplateController.updateTemplate
);

// Delete template (admin only)
router.delete('/:id', authenticate, isAdmin, emailTemplateController.deleteTemplate);

// Toggle template active status (admin only)
router.patch('/:id/toggle', authenticate, isAdmin, emailTemplateController.toggleTemplateActive);

module.exports = router;
