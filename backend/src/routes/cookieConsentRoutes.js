const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const cookieConsentController = require('../controllers/cookieConsentController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Validation rules for creating consent
const createConsentValidation = [
    body('consent_type')
        .isIn(['accept_all', 'reject_all', 'custom'])
        .withMessage('consent_type must be accept_all, reject_all, or custom'),
    body('necessary_cookies').optional().isBoolean().withMessage('necessary_cookies must be a boolean'),
    body('functional_cookies').optional().isBoolean().withMessage('functional_cookies must be a boolean'),
    body('analytics_cookies').optional().isBoolean().withMessage('analytics_cookies must be a boolean'),
    body('marketing_cookies').optional().isBoolean().withMessage('marketing_cookies must be a boolean'),
    body('session_id').optional().isString().withMessage('session_id must be a string')
];

// Validation rules for updating consent
const updateConsentValidation = [
    body('consent_type')
        .optional()
        .isIn(['accept_all', 'reject_all', 'custom'])
        .withMessage('consent_type must be accept_all, reject_all, or custom'),
    body('necessary_cookies').optional().isBoolean().withMessage('necessary_cookies must be a boolean'),
    body('functional_cookies').optional().isBoolean().withMessage('functional_cookies must be a boolean'),
    body('analytics_cookies').optional().isBoolean().withMessage('analytics_cookies must be a boolean'),
    body('marketing_cookies').optional().isBoolean().withMessage('marketing_cookies must be a boolean')
];

// Validation rules for getting consent
const getConsentValidation = [
    query('user_id').optional().isInt().withMessage('user_id must be an integer'),
    query('session_id').optional().isString().withMessage('session_id must be a string')
];

// Routes
// POST /api/cookie-consent - Create or update cookie consent (public, but can be authenticated)
router.post('/', createConsentValidation, cookieConsentController.createConsent);

// GET /api/cookie-consent - Get current cookie consent (public, but can be authenticated)
router.get('/', getConsentValidation, cookieConsentController.getConsent);

// PUT /api/cookie-consent/:uuid - Update cookie consent (public, but can be authenticated)
router.put('/:uuid', updateConsentValidation, cookieConsentController.updateConsent);

// DELETE /api/cookie-consent/:uuid - Withdraw cookie consent (public, but can be authenticated)
router.delete('/:uuid', cookieConsentController.deleteConsent);

// GET /api/cookie-consent/:uuid/logs - Get consent audit logs (public, but can be authenticated)
router.get('/:uuid/logs', cookieConsentController.getConsentLogs);

// Admin Analytics Routes (Admin only)
router.get('/admin/stats/daily', authenticate, isAdmin, cookieConsentController.getDailyConsentStats);
router.get('/admin/stats/monthly', authenticate, isAdmin, cookieConsentController.getMonthlyConsentStats);
router.get('/admin/stats/country', authenticate, isAdmin, cookieConsentController.getConsentByCountry);
router.get('/admin/stats/browser', authenticate, isAdmin, cookieConsentController.getConsentByBrowser);
router.get('/admin/stats/percentages', authenticate, isAdmin, cookieConsentController.getConsentPercentages);

module.exports = router;
