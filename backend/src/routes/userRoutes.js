const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const { hasPermission, hasAnyPermission, isOwnerOrHasPermission } = require('../middleware/permissions');
const { upload, uploadWithPdf } = require('../middleware/upload');

// All user routes require authentication
router.use(authenticate);

// Notifications
router.get('/notifications', hasPermission('settings.read'), notificationController.getNotifications);
router.put('/notifications/:id/read', hasPermission('settings.update'), notificationController.markAsRead);

// Content creation — any authenticated user can create content
router.post('/content', 
    uploadWithPdf.fields([{ name: 'banner_image', maxCount: 1 }, { name: 'pdf_file', maxCount: 1 }]), 
    contentController.createContent
);

// Content update - owner or has permission
router.put('/content/:id', 
    isOwnerOrHasPermission('content.update', async (req) => {
        const Content = require('../models/Content');
        const content = await Content.findById(req.params.id);
        return content ? content.user_id : null;
    }),
    uploadWithPdf.fields([{ name: 'banner_image', maxCount: 1 }, { name: 'pdf_file', maxCount: 1 }]), 
    contentController.updateContent
);

router.put('/content/:id/webhook', 
    isOwnerOrHasPermission('content.update', async (req) => {
        const Content = require('../models/Content');
        const content = await Content.findById(req.params.id);
        return content ? content.user_id : null;
    }),
    contentController.updateWebhookSettings
);

router.post('/content/:id/submit', 
    isOwnerOrHasPermission('content.publish', async (req) => {
        const Content = require('../models/Content');
        const content = await Content.findById(req.params.id);
        return content ? content.user_id : null;
    }),
    contentController.submitForReview
);

// View content — any authenticated user
router.get('/content', contentController.getUserContent);
router.get('/content/:id', contentController.getUserContentById);

// User's article submissions (landing page form data)
router.get('/submissions', async (req, res) => {
    try {
        const LandingPage = require('../models/LandingPage');
        const { limit = 50, offset = 0, content_id } = req.query;
        let result;
        if (content_id) {
            const Content = require('../models/Content');
            const content = await Content.findById(content_id);
            if (!content || content.user_id !== req.user.id)
                return res.status(403).json({ message: 'Access denied' });
            result = await LandingPage.findAll({ content_id, limit, offset });
        } else {
            result = await LandingPage.findByUserId(req.user.id, { limit, offset });
        }
        res.json({ data: result.rows, total: result.total });
    } catch (error) {
        console.error('Get user submissions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;