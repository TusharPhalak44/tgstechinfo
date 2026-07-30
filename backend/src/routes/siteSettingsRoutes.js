const express = require('express');
const router = express.Router();
const siteSettingsController = require('../controllers/siteSettingsController');
const { authenticate } = require('../middleware/auth');

// Increase body size limit for logo uploads (base64 images can be large)
router.use(express.json({ limit: '20mb' }));
router.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Public route for website favicon (no authentication required)
router.get('/public', siteSettingsController.getSettings);

// All other site settings routes require authentication
router.use(authenticate);

router.get('/', siteSettingsController.getSettings);
router.put('/', siteSettingsController.updateSettings);
router.put('/logo/:type', siteSettingsController.uploadLogo);

module.exports = router;
