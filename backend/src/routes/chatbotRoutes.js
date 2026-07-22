const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { body } = require('express-validator');

// Validation rules
const searchValidation = [
    body('query').trim().notEmpty().withMessage('Query is required'),
    body('searchType').optional().isIn(['title', 'category', 'tag', 'keyword', 'content_type']).withMessage('Invalid search type'),
    body('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
];

const clickValidation = [
    body('contentId').isInt().withMessage('Content ID must be an integer'),
    body('sessionId').notEmpty().withMessage('Session ID is required'),
    body('position').optional().isInt({ min: 0 }).withMessage('Position must be a non-negative integer')
];

const sessionValidation = [
    body('sessionId').notEmpty().withMessage('Session ID is required')
];

const messageValidation = [
    body('sessionId').notEmpty().withMessage('Session ID is required'),
    body('messageType').isIn(['user', 'bot']).withMessage('Message type must be user or bot'),
    body('message').trim().notEmpty().withMessage('Message is required')
];

const feedbackValidation = [
    body('sessionId').notEmpty().withMessage('Session ID is required'),
    body('feedbackType').isIn(['helpful', 'not_helpful', 'irrelevant', 'inaccurate']).withMessage('Invalid feedback type'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
];

const submitQueryValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('query').trim().notEmpty().withMessage('Query is required')
];

// Routes

/**
 * POST /api/chatbot/search
 * Search content with ranking logic
 */
router.post('/search', searchValidation, chatbotController.search);

/**
 * POST /api/chatbot/click
 * Log content click from chatbot
 */
router.post('/click', clickValidation, chatbotController.logClick);

/**
 * GET /api/chatbot/trending
 * Get trending content based on chatbot interactions
 */
router.get('/trending', chatbotController.getTrending);

/**
 * GET /api/chatbot/categories
 * Get categories for chatbot
 */
router.get('/categories', chatbotController.getCategories);

/**
 * GET /api/chatbot/recent
 * Get recent content for chatbot
 */
router.get('/recent', chatbotController.getRecent);

/**
 * POST /api/chatbot/session
 * Create or update chatbot session
 */
router.post('/session', sessionValidation, chatbotController.createSession);

/**
 * POST /api/chatbot/message
 * Log chatbot message
 */
router.post('/message', messageValidation, chatbotController.logMessage);

/**
 * POST /api/chatbot/feedback
 * Submit feedback for chatbot response
 */
router.post('/feedback', feedbackValidation, chatbotController.submitFeedback);

/**
 * GET /api/chatbot/autocomplete
 * Autocomplete for search input
 */
router.get('/autocomplete', chatbotController.autocomplete);

/**
 * GET /api/chatbot/related/:contentId
 * Get related content for a specific content item
 */
router.get('/related/:contentId', chatbotController.getRelatedContent);

/**
 * GET /api/chatbot/suggestions
 * Get no result suggestions when search returns empty
 */
router.get('/suggestions', chatbotController.getNoResultSuggestions);

/**
 * GET /api/chatbot/related-suggestions
 * Get related category/tag suggestions based on query
 */
router.get('/related-suggestions', chatbotController.getRelatedSuggestions);

/**
 * POST /api/chatbot/detect-intent
 * Detect intent from user query
 */
router.post('/detect-intent', chatbotController.detectIntent);

/**
 * POST /api/chatbot/submit-query
 * Submit a user query for admin review
 */
router.post('/submit-query', submitQueryValidation, chatbotController.submitQuery);

/**
 * GET /api/chatbot/queries
 * Get all queries (admin only)
 */
router.get('/queries', chatbotController.getQueries);

/**
 * GET /api/chatbot/queries/stats
 * Get query statistics (admin only)
 */
router.get('/queries/stats', chatbotController.getQueryStats);

/**
 * PUT /api/chatbot/queries/:id
 * Update query status and add admin response (admin only)
 */
router.put('/queries/:id', chatbotController.updateQuery);

module.exports = router;
