const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Middleware applied to specific admin analytics endpoints
// (Scoped to route handlers to prevent shadowing sibling routers mounted at /api/analytics)
const adminAuth = [authenticate, isAdmin];

// Overview Analytics
router.get('/overview', adminAuth, analyticsController.getOverview);

// Content Type Analytics
router.get('/content-type-breakdown', adminAuth, analyticsController.getContentTypeBreakdown);

// Content Analytics
router.get('/content/:content_id', adminAuth, analyticsController.getContentAnalytics);

// Top Content by Engagement
router.get('/top-content-engagement', adminAuth, analyticsController.getTopContentByEngagement);

// Session Analytics
router.get('/sessions', adminAuth, analyticsController.getSessionAnalytics);

// Popular Pages
router.get('/popular-pages', adminAuth, analyticsController.getPopularPages);

// Popular Downloads
router.get('/popular-downloads', adminAuth, analyticsController.getPopularDownloads);

// Search Analytics
router.get('/search', adminAuth, analyticsController.getSearchAnalytics);

// User Journey Analytics
router.get('/journey', adminAuth, analyticsController.getJourneyAnalytics);

// CTA Analytics
router.get('/cta', adminAuth, analyticsController.getCtaAnalytics);

// Newsletter Analytics
router.get('/newsletter', adminAuth, analyticsController.getNewsletterAnalytics);

module.exports = router;
