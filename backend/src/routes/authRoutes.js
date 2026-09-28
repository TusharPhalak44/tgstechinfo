const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { registerLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

// Validation rules
const registerValidation = [
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('job_title')
        .trim()
        .notEmpty().withMessage('Job title is required')
        .isLength({ max: 150 }).withMessage('Job title must not exceed 150 characters'),
    body('company_name')
        .trim()
        .notEmpty().withMessage('Company name is required')
        .isLength({ max: 200 }).withMessage('Company name must not exceed 200 characters'),
    body('country')
        .trim()
        .optional()
        .isLength({ max: 100 }).withMessage('Country must not exceed 100 characters'),
    body('password').isLength({ min: 12 }).withMessage('Password must be at least 12 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
        .withMessage('Password must include uppercase, lowercase, number & special character')
];

const loginValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
];

// Routes
router.post('/register', registerLimiter, registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, authController.resetPassword);
router.post('/change-password', authenticate, authController.changePassword);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.get('/sessions', authenticate, authController.getSessions);
router.delete('/sessions/:sessionId', authenticate, authController.revokeSession);
router.delete('/sessions', authenticate, authController.revokeAllSessions);
router.get('/login-history', authenticate, authController.getLoginHistory);

module.exports = router;