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

// Apply analytics consent check to all other tracking routes
router.use(checkAnalyticsConsent);

// Session Management
router.post('/session/start', [
    body('consent_uuid').notEmpty().withMessage('Consent UUID is required'),
    body('landing_page').notEmpty().withMessage('Landing page is required')
], trackingController.startSession);

// Page View Tracking
router.post('/page-view', [
    body('session_uuid').notEmpty().withMessage('Session UUID is required'),
    body('consent_uuid').notEmpty().withMessage('Consent UUID is required'),
    body('page_url').notEmpty().withMessage('Page URL is required'),
    body('page_type').isIn(['home', 'article', 'blog', 'category', 'search', 'contact', 'landing', 'other']).withMessage('Invalid page type')
], trackingController.trackPageView);

// Content Engagement Tracking
router.post('/engagement', [
    body('session_uuid').notEmpty().withMessage('Session UUID is required'),
    body('consent_uuid').notEmpty().withMessage('Consent UUID is required'),
    body('content_id').notEmpty().withMessage('Content ID is required'),
    body('engagement_type').isIn(['view', 'read', 'download', 'share', 'bookmark', 'print', 'copy_link']).withMessage('Invalid engagement type')
], trackingController.trackEngagement);

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
