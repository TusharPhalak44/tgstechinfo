/**
 * Admin B2B Audience Intelligence Routes
 */

const express = require('express');
const router = express.Router();
const adminAudienceController = require('../controllers/adminAudienceController');
const { authenticate } = require('../middleware/auth');

// Require authentication for all admin audience routes
router.use(authenticate);

// Global Settings
router.get('/settings', adminAudienceController.getGlobalSettings);
router.put('/settings', adminAudienceController.updateGlobalSettings);

// Taxonomies
router.get('/taxonomies', adminAudienceController.getAdminTaxonomies);
router.post('/taxonomies/:type', adminAudienceController.upsertTaxonomyItem);
router.put('/taxonomies/:type', adminAudienceController.upsertTaxonomyItem);

// Statistics Explorer & Editing
router.get('/statistics', adminAudienceController.getStatisticsList);
router.put('/statistics/:id', adminAudienceController.updateStatisticRecord);

// Data Import & Validation
router.post('/import', adminAudienceController.importAudienceData);
router.get('/imports', adminAudienceController.getImportHistory);

// Proportional Regional / Scope Volume Adjustment
router.post('/preview-adjustment', adminAudienceController.previewAudienceAdjustment);
router.post('/adjust-volume', adminAudienceController.adjustAudienceVolume);
router.get('/adjustment-history', adminAudienceController.getAdjustmentHistory);

// Data Quality & Coverage Matrix Report
router.get('/quality-report', adminAudienceController.getDataQualityReport);

// Audit Logs
router.get('/audit-logs', adminAudienceController.getAuditLogs);

module.exports = router;
