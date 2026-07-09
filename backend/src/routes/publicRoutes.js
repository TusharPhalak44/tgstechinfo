const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const adminController = require('../controllers/adminController');
const notificationController = require('../controllers/notificationController');

// Search
router.get('/search', notificationController.searchContent);

// Public content routes
router.get('/content', publicController.getPublishedContent);
router.get('/content/:slug', publicController.getContentBySlug);
router.post('/landing-page', publicController.submitLandingPage);
router.post('/subscribe-content', publicController.subscribeContent);
router.post('/newsletter', publicController.subscribeNewsletter);
router.get('/categories', publicController.getCategories);
router.get('/categories-with-count', publicController.getCategoriesWithCount);
router.get('/content-types', publicController.getContentTypes);

// Public stats
router.get('/stats', publicController.getPublicStats);

// Public submission API — no auth required
router.get('/submission/:id', adminController.getSubmissionById);

module.exports = router;