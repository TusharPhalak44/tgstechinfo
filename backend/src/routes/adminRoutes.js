const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const notificationController = require('../controllers/notificationController');
const { authenticate, isAdmin } = require('../middleware/auth');
const { upload, uploadWithPdf } = require('../middleware/upload');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// Notifications
router.get('/notifications', notificationController.getNotifications);
router.put('/notifications/:id/read', notificationController.markAsRead);

// ✅ Admin can only review, approve, reject, and manage content
router.get('/content/all', adminController.getAllContent);
router.get('/content/pending', adminController.getPendingContent);
router.put('/content/:id/review', adminController.reviewContent);
router.get('/content/:id', adminController.getContentDetails);

// User management
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/status', adminController.updateUserStatus);
router.get('/users/:id/content', adminController.getUserContent);

// Dashboard stats
router.get('/stats', adminController.getDashboardStats);

// Landing page submissions
router.get('/submissions', adminController.getSubmissions);

// Data requests (DSAR + Do Not Sell)
router.get('/data-requests', adminController.getDataRequests);
router.put('/data-requests/:id/status', adminController.updateDataRequestStatus);

// ✅ Admin can edit any content directly
router.put('/content/:id/edit', uploadWithPdf.fields([{ name: 'banner_image', maxCount: 1 }, { name: 'pdf_file', maxCount: 1 }]), adminController.adminEditContent);
router.delete('/content/:id', adminController.deleteContent);

module.exports = router;