const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const notificationController = require('../controllers/notificationController');
const { authenticate, isContentCreator } = require('../middleware/auth');
const { upload, uploadWithPdf } = require('../middleware/upload');

// ✅ All user routes require authentication
router.use(authenticate);

// Notifications
router.get('/notifications', notificationController.getNotifications);
router.put('/notifications/:id/read', notificationController.markAsRead);

// ✅ Content creation - Only users can create, not admin
router.post('/content', isContentCreator, uploadWithPdf.fields([{ name: 'banner_image', maxCount: 1 }, { name: 'pdf_file', maxCount: 1 }]), contentController.createContent);
router.put('/content/:id', isContentCreator, uploadWithPdf.fields([{ name: 'banner_image', maxCount: 1 }, { name: 'pdf_file', maxCount: 1 }]), contentController.updateContent);
router.post('/content/:id/submit', isContentCreator, contentController.submitForReview);

// ✅ View content - Both users and admin can view
router.get('/content', contentController.getUserContent);
router.get('/content/:id', contentController.getUserContentById);

// ✅ User's article submissions (landing page form data)
router.get('/submissions', async (req, res) => {
    try {
        const LandingPage = require('../models/LandingPage');
        const { limit = 50, offset = 0, content_id } = req.query;
        let result;
        if (content_id) {
            // filter by specific article (must belong to this user)
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