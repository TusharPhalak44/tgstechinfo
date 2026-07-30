const express = require('express');
const router = express.Router();
const siteSettingsController = require('../controllers/siteSettingsController');
const { authenticate } = require('../middleware/auth');

// Public route for website favicon (no authentication required)
router.get('/public', siteSettingsController.getSettings);

// All other site settings routes require authentication
router.use(authenticate);

router.get('/', siteSettingsController.getSettings);
router.put('/', siteSettingsController.updateSettings);
router.put('/logo/:type', siteSettingsController.uploadLogo);

module.exports = router;
