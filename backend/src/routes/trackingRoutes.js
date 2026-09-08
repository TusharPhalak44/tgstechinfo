const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const trackingController = require('../controllers/trackingController');
const { checkAnalyticsConsent } = require('../controllers/trackingController');

// POST endpoint for page view updates (for sendBeacon compatibility)
// No consent check needed - this just updates an existing record
// This must be defined BEFORE the consent check middleware
router.post('/page-view/update', [
    body('id').notEmpty().withMessage('Page view ID is required')
], trackingController.updatePageView);

// PUT endpoint for page view updates (regular API calls)
// No consent check needed - this just updates an existing record
// This must be defined BEFORE the consent check middleware
router.put('/page-view', [
    body('id').notEmpty().withMessage('Page view ID is required')
], trackingController.updatePageView);

// POST endpoint for session ending (for sendBeacon compatibility)
// No consent check needed - this just updates an existing record
// This must be defined BEFORE the consent check middleware
router.post('/session/end', [
    body('session_uuid').notEmpty().withMessage('Session UUID is required')
], trackingController.endSession);

// Session start should also be before consent check for initialization
router.post('/session/start', [
    body('landing_page').notEmpty().withMessage('Landing page is required')
    // consent_uuid is now optional for compatibility
], trackingController.startSession);

// Content Engagement Tracking - moved before consent check for compatibility
router.post('/engagement', [
    body('session_uuid').notEmpty().withMessage('Session UUID is required'),
    body('content_id').notEmpty().withMessage('Content ID is required'),
    body('engagement_type').notEmpty().withMessage('Engagement type is required')
], trackingController.trackEngagement);

// Apply analytics consent check to all other tracking routes
router.use(checkAnalyticsConsent);

// Page View Tracking
router.post('/page-view', [
    body('session_uuid').notEmpty().withMessage('Session UUID is required'),
    body('consent_uuid').notEmpty().withMessage('Consent UUID is required'),
    body('page_url').notEmpty().withMessage('Page URL is required'),
    body('page_type').custom(value => {
        const supportedPageTypes = ['home', 'article', 'blog', 'category', 'search', 'contact', 'landing', 'other'];
        if (!supportedPageTypes.includes(value)) {
            throw new Error('Invalid page type');
        }
        return true;
    }).withMessage('Invalid page type')
], trackingController.trackPageView);

// Download Tracking
router.post('/download', [
    body('session_uuid').notEmpty().withMessage('Session UUID is required'),
    body('consent_uuid').notEmpty().withMessage('Consent UUID is required'),
    body('content_id').notEmpty().withMessage('Content ID is required'),
    body('file_name').notEmpty().withMessage('File name is required')
], trackingController.trackDownload);

// Search Tracking
router.post('/search', [
    body('session_uuid').notEmpty().withMessage('Session UUID is required'),
    body('consent_uuid').notEmpty().withMessage('Consent UUID is required'),
    body('search_keyword').notEmpty().withMessage('Search keyword is required'),
    body('search_type').isIn(['keyword', 'category', 'tag', 'content_type']).withMessage('Invalid search type')
], trackingController.trackSearch);

// Video Progress Tracking
router.post('/video', [
    body('session_uuid').notEmpty().withMessage('Session UUID is required'),
    body('consent_uuid').notEmpty().withMessage('Consent UUID is required'),
    body('content_id').notEmpty().withMessage('Content ID is required')
], trackingController.trackVideo);

// CTA Click Tracking
router.post('/cta', [
    body('session_uuid').notEmpty().withMessage('Session UUID is required'),
    body('consent_uuid').notEmpty().withMessage('Consent UUID is required'),
    body('cta_type').isIn(['download_whitepaper', 'request_demo', 'contact_sales', 'subscribe', 'register_webinar', 'request_quote', 'other']).withMessage('Invalid CTA type')
], trackingController.trackCta);

// Newsletter Event Tracking
router.post('/newsletter', [
    body('session_uuid').notEmpty().withMessage('Session UUID is required'),
    body('consent_uuid').notEmpty().withMessage('Consent UUID is required'),
    body('event_type').isIn(['signup', 'confirmation', 'unsubscribe', 'bounce']).withMessage('Invalid event type'),
    body('email').isEmail().withMessage('Invalid email address')
], trackingController.trackNewsletter);

module.exports = router;
