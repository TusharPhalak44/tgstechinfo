/**
 * Public & Sales Audience Intelligence Routes
 */

const express = require('express');
const router = express.Router();
const audienceController = require('../controllers/audienceController');

// Enable permissive CORS for public audience intelligence endpoints
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

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
