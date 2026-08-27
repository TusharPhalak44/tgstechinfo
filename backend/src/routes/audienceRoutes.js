/**
 * Public & Sales Audience Intelligence Routes
 */

const express = require('express');
const router = express.Router();
const audienceController = require('../controllers/audienceController');

// Metadata & Taxonomies
router.get('/metadata', audienceController.getMetadata);

// Filter & High-Speed Calculation (supports both GET and POST)
router.get('/stats', audienceController.calculateAudienceStats);
router.post('/stats', audienceController.calculateAudienceStats);

// Shareable Presentation Links
router.post('/share', audienceController.createShareToken);
router.get('/view/:token', audienceController.getSharedAudience);

// Sales Analytics Event Tracking
router.post('/track-event', audienceController.trackEvent);

module.exports = router;
