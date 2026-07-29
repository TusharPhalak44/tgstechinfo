const express = require('express');
const router = express.Router();
const seoController = require('../controllers/seoController');
const { authenticate, isAdmin } = require('../middleware/auth');

// All SEO routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// Get SEO settings
router.get('/settings', seoController.getSeoSettings);

// Update SEO settings
router.put('/settings', seoController.updateSeoSettings);

// Get page SEO analysis
router.get('/analysis', seoController.getPageSeoAnalysis);

// Get overall SEO score
router.get('/score', seoController.getSeoScore);

// Generate sitemap
router.get('/sitemap', seoController.generateSitemap);

module.exports = router;
