const express = require('express');
const router = express.Router();
const seoController = require('../controllers/seoController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Public: site title is needed on every page for <title> tag
router.get('/settings', seoController.getSeoSettings);

// Public: sitemap for search engines & web crawlers
router.get('/sitemap', seoController.generateSitemap);

// All other SEO routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// Update SEO settings
router.put('/settings', seoController.updateSeoSettings);

// Get page SEO analysis
router.get('/analysis', seoController.getPageSeoAnalysis);

// Get overall SEO score
router.get('/score', seoController.getSeoScore);

module.exports = router;
