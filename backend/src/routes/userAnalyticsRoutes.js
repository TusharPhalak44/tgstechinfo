const express = require('express');
const router = express.Router();
const userContentAnalyticsController = require('../controllers/userContentAnalyticsController');
const { authenticate } = require('../middleware/auth');

// All user analytics routes require authentication
router.use(authenticate);

// Get overview of all content analytics for the current user
router.get('/overview', userContentAnalyticsController.getUserContentOverview);

// Get dashboard summary for quick stats
router.get('/dashboard', userContentAnalyticsController.getDashboardSummary);

// Get detailed analytics for a specific content item
router.get('/content/:content_id', userContentAnalyticsController.getContentDetailAnalytics);

// Get location-based analytics for specific content
router.get('/content/:content_id/locations', userContentAnalyticsController.getContentLocationAnalytics);

// Get engagement details for specific content
router.get('/content/:content_id/engagement', userContentAnalyticsController.getContentEngagementAnalytics);

module.exports = router;