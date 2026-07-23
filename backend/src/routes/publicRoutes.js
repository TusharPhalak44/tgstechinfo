const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const adminController = require('../controllers/adminController');
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const {
    strictLimiter,
    passwordResetLimiter,
    apiLimiter
} = require('../middleware/rateLimiter');

// Search
router.get('/search', apiLimiter, notificationController.searchContent);

// Public content routes
router.get('/content', publicController.getPublishedContent);
router.get('/content/:slug', publicController.getContentBySlug);
// Alias routes for landing pages — /lp/:slug and /landing-page/:slug resolve the same as /content/:slug
router.get('/lp/:slug', publicController.getContentBySlug);
router.get('/landing-page/:slug', publicController.getContentBySlug);
router.post('/landing-page', strictLimiter, publicController.submitLandingPage);
router.post('/subscribe-content', strictLimiter, publicController.subscribeContent);
router.post('/newsletter', strictLimiter, publicController.subscribeNewsletter);
router.get('/categories', publicController.getCategories);
router.get('/categories-with-count', publicController.getCategoriesWithCount);
router.get('/content-types', publicController.getContentTypes);

// Public stats
router.get('/stats', publicController.getPublicStats);

// Case studies
router.get('/case-studies', publicController.getCaseStudies);
router.get('/case-study/:slug', publicController.getCaseStudyBySlug);
router.post('/case-study-gate', strictLimiter, publicController.submitCaseStudyGate);

// Newsletter
router.get('/newsletter/unsubscribe', publicController.unsubscribeNewsletter);

// Data requests (DSAR + Do Not Sell)
router.post('/data-request/dsar', passwordResetLimiter, publicController.submitDataRequest);
router.post('/data-request/do-not-sell', passwordResetLimiter, publicController.submitDoNotSell);

// Contact form — 10 per hour per IP
router.post('/contact', strictLimiter, publicController.submitContact);

// Public submission API — protected by strictLimiter to prevent enumeration
router.get('/submission/:id', strictLimiter, adminController.getSubmissionById);

// Dynamic form submissions (requires authentication)
router.get('/dynamic-form-submissions/:content_id', authenticate, publicController.getDynamicFormSubmissions);

module.exports = router;
