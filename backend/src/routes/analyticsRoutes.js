const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, isAdmin } = require('../middleware/auth');

// All analytics routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// Overview Analytics
router.get('/overview', analyticsController.getOverview);

// Content Analytics
router.get('/content/:content_id', analyticsController.getContentAnalytics);

// Session Analytics
router.get('/sessions', analyticsController.getSessionAnalytics);

// Popular Pages
router.get('/popular-pages', analyticsController.getPopularPages);

// Popular Downloads
router.get('/popular-downloads', analyticsController.getPopularDownloads);

// Search Analytics
router.get('/search', analyticsController.getSearchAnalytics);

// User Journey Analytics
router.get('/journey', analyticsController.getJourneyAnalytics);

// CTA Analytics
router.get('/cta', analyticsController.getCtaAnalytics);

// Newsletter Analytics
router.get('/newsletter', analyticsController.getNewsletterAnalytics);

module.exports = router;
