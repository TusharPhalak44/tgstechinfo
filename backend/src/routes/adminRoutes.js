const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const notificationController = require('../controllers/notificationController');
const Category = require('../models/Category');
const { authenticate } = require('../middleware/auth');
const { hasPermission, hasAnyPermission } = require('../middleware/permissions');
const { upload, uploadWithPdf } = require('../middleware/upload');

// All admin routes require authentication
router.use(authenticate);

// Notifications
router.get('/notifications', hasPermission('settings.read'), notificationController.getNotifications);
router.put('/notifications/:id/read', hasPermission('settings.update'), notificationController.markAsRead);

// Content management
router.get('/content/all', adminController.getAllContent);
router.get('/content/pending', adminController.getPendingContent);
router.put('/content/:id/review', hasPermission('content.publish'), adminController.reviewContent);
router.get('/content/:id', adminController.getContentDetails);

// User management
router.get('/users', hasPermission('user.read'), adminController.getAllUsers);
router.put('/users/:id/status', hasPermission('user.update'), adminController.updateUserStatus);
router.get('/users/:id/content', hasPermission('user.read'), adminController.getUserContent);

// Dashboard stats — accessible to any authenticated user
router.get('/stats', adminController.getDashboardStats);
router.get('/recent-activity', adminController.getRecentActivity);
router.get('/content-by-status', adminController.getContentByStatus);

// Landing page submissions
router.get('/submissions', hasPermission('content.read'), adminController.getSubmissions);

// Data requests (DSAR + Do Not Sell)
router.get('/data-requests', hasPermission('user.read'), adminController.getDataRequests);
router.put('/data-requests/:id/status', hasPermission('user.update'), adminController.updateDataRequestStatus);

// Content editing and deletion
router.put('/content/:id/edit', 
    hasPermission('content.update'), 
    uploadWithPdf.fields([{ name: 'banner_image', maxCount: 1 }, { name: 'pdf_file', maxCount: 1 }]), 
    adminController.adminEditContent
);
router.delete('/content/:id', hasPermission('content.delete'), adminController.deleteContent);

// Category management
router.get('/categories', hasPermission('content.read'), async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/categories', hasPermission('content.create'), async (req, res) => {
    try {
        const category = await Category.create(req.body);
        res.status(201).json(category);
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/categories/:id', hasPermission('content.update'), async (req, res) => {
    try {
        const category = await Category.update(req.params.id, req.body);
        res.json(category);
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/categories/:id', hasPermission('content.delete'), async (req, res) => {
    try {
        const deleted = await Category.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;