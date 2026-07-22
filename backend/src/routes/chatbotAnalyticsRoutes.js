const express = require('express');
const router = express.Router();
const chatbotAnalyticsController = require('../controllers/chatbotAnalyticsController');

/**
 * Chatbot Analytics Routes
 * All routes require admin authentication (handled by middleware in server.js)
 */

/**
 * GET /api/admin/chatbot/analytics/dashboard
 * Get comprehensive dashboard analytics
 */
router.get('/dashboard', chatbotAnalyticsController.getDashboard);

/**
 * GET /api/admin/chatbot/analytics/top-searches
 * Get top searches
 */
router.get('/top-searches', chatbotAnalyticsController.getTopSearches);

/**
 * GET /api/admin/chatbot/analytics/top-categories
 * Get top categories
 */
router.get('/top-categories', chatbotAnalyticsController.getTopCategories);

/**
 * GET /api/admin/chatbot/analytics/most-clicked
 * Get most clicked content
 */
router.get('/most-clicked', chatbotAnalyticsController.getMostClicked);

/**
 * GET /api/admin/chatbot/analytics/no-result-searches
 * Get searches with no results
 */
router.get('/no-result-searches', chatbotAnalyticsController.getNoResultSearches);

/**
 * GET /api/admin/chatbot/analytics/sessions
 * Get session analytics
 */
router.get('/sessions', chatbotAnalyticsController.getSessionAnalytics);

/**
 * GET /api/admin/chatbot/analytics/average-session-time
 * Get average session time
 */
router.get('/average-session-time', chatbotAnalyticsController.getAverageSessionTime);

/**
 * GET /api/admin/chatbot/analytics/ctr
 * Get click-through rate
 */
router.get('/ctr', chatbotAnalyticsController.getCTR);

/**
 * GET /api/admin/chatbot/analytics/daily
 * Get daily analytics
 */
router.get('/daily', chatbotAnalyticsController.getDailyAnalytics);

/**
 * GET /api/admin/chatbot/analytics/monthly
 * Get monthly analytics
 */
router.get('/monthly', chatbotAnalyticsController.getMonthlyAnalytics);

/**
 * GET /api/admin/chatbot/analytics/feedback
 * Get feedback analytics
 */
router.get('/feedback', chatbotAnalyticsController.getFeedbackAnalytics);

module.exports = router;
