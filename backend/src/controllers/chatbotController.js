const ChatbotSearchService = require('../services/chatbotSearchService');
const RecommendationService = require('../services/recommendationService');
const ChatbotQuery = require('../models/ChatbotQuery');
const Category = require('../models/Category');
const Content = require('../models/Content');
const { detectIntent } = require('../utils/intentDetection');
const { searchKnowledgeBase } = require('../data/websiteKnowledgeBase');
const { sendEmail, chatbotQueryAdminTemplate, chatbotQueryResponseTemplate } = require('../config/email');
const { validationResult } = require('express-validator');

/**
 * Chatbot Search Controller
 * Handles search requests for the AI-powered Content Discovery Assistant
 */

exports.search = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { query, searchType = 'keyword', limit = 10, categoryId, contentTypeId } = req.body;
        const sessionId = req.headers['x-session-id'] || req.body.sessionId || null;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({ message: 'Query is required' });
        }

        // Perform search
        const results = await ChatbotSearchService.search(query, {
            searchType,
            limit: Math.min(limit, 50), // Cap at 50 results
            categoryId,
            contentTypeId,
            status: 'published'
        });

        // Log search if session ID is provided
        if (sessionId) {
            const metadata = {
                ip_address: req.ip,
                country: req.headers['cf-ipcountry'] || null,
                device_type: req.headers['user-agent'] ? detectDevice(req.headers['user-agent']) : null,
                browser_info: {
                    user_agent: req.headers['user-agent'],
                    referer: req.headers['referer']
                }
            };
            await ChatbotSearchService.logSearch(sessionId, query, searchType, results.length, metadata);
        }

        res.json({
            success: true,
            query,
            searchType,
            results,
            count: results.length
        });
    } catch (error) {
        console.error('Chatbot search error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Search failed',
            error: error.message 
        });
    }
};

/**
 * Log content click from chatbot
 */
exports.logClick = async (req, res) => {
    try {
        const { contentId, searchQuery, searchType, position } = req.body;
        const sessionId = req.headers['x-session-id'] || req.body.sessionId || null;

        if (!contentId) {
            return res.status(400).json({ message: 'Content ID is required' });
        }

        if (!sessionId) {
            return res.status(400).json({ message: 'Session ID is required' });
        }

        const metadata = {
            ip_address: req.ip,
            country: req.headers['cf-ipcountry'] || null,
            device_type: req.headers['user-agent'] ? detectDevice(req.headers['user-agent']) : null
        };

        await ChatbotSearchService.logClick(sessionId, contentId, searchQuery, searchType, position, metadata);

        res.json({ success: true, message: 'Click logged successfully' });
    } catch (error) {
        console.error('Chatbot log click error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to log click',
            error: error.message 
        });
    }
};

/**
 * Get trending content based on chatbot interactions
 */
exports.getTrending = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const results = await ChatbotSearchService.getTrending(Math.min(limit, 50));

        res.json({
            success: true,
            results,
            count: results.length
        });
    } catch (error) {
        console.error('Get trending error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get trending content',
            error: error.message 
        });
    }
};

/**
 * Get categories for chatbot
 */
exports.getCategories = async (req, res) => {
    try {
        const categories = await ChatbotSearchService.getCategories();

        res.json({
            success: true,
            categories,
            count: categories.length
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get categories',
            error: error.message 
        });
    }
};

/**
 * Get recent content for chatbot
 */
exports.getRecent = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const results = await ChatbotSearchService.getRecent(Math.min(limit, 50));

        res.json({
            success: true,
            results,
            count: results.length
        });
    } catch (error) {
        console.error('Get recent error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get recent content',
            error: error.message 
        });
    }
};

/**
 * Create or update chatbot session
 */
exports.createSession = async (req, res) => {
    try {
        const { sessionId, userId, visitorSessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ message: 'Session ID is required' });
        }

        const metadata = {
            ip_address: req.ip,
            country: req.headers['cf-ipcountry'] || null,
            device_type: req.headers['user-agent'] ? detectDevice(req.headers['user-agent']) : null,
            browser_info: {
                user_agent: req.headers['user-agent'],
                referer: req.headers['referer']
            }
        };

        const { pool } = require('../config/database');

        // Check if session exists
        const [existing] = await pool.query(
            'SELECT id FROM chatbot_sessions WHERE session_id = ?',
            [sessionId]
        );

        if (existing.length > 0) {
            // Update last activity
            await pool.query(
                'UPDATE chatbot_sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_id = ?',
                [sessionId]
            );
        } else {
            // Create new session
            await pool.query(
                `INSERT INTO chatbot_sessions 
                (session_id, user_id, visitor_session_id, browser_info, country, device_type, ip_address)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    sessionId,
                    userId || null,
                    visitorSessionId || null,
                    JSON.stringify(metadata.browser_info),
                    metadata.country,
                    metadata.device_type,
                    metadata.ip_address
                ]
            );
        }

        res.json({ success: true, sessionId });
    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create session',
            error: error.message 
        });
    }
};

/**
 * Log chatbot message
 */
exports.logMessage = async (req, res) => {
    try {
        const { sessionId, messageType, message, metadata } = req.body;

        if (!sessionId || !messageType || !message) {
            return res.status(400).json({ 
                message: 'Session ID, message type, and message are required' 
            });
        }

        if (!['user', 'bot'].includes(messageType)) {
            return res.status(400).json({ message: 'Invalid message type' });
        }

        const { pool } = require('../config/database');

        await pool.query(
            `INSERT INTO chatbot_messages 
            (session_id, message_type, message, metadata)
            VALUES (?, ?, ?, ?)`,
            [
                sessionId,
                messageType,
                message,
                metadata ? JSON.stringify(metadata) : null
            ]
        );

        // Update session message count
        await pool.query(
            `UPDATE chatbot_sessions 
            SET message_count = message_count + 1, last_activity = CURRENT_TIMESTAMP 
            WHERE session_id = ?`,
            [sessionId]
        );

        res.json({ success: true, message: 'Message logged successfully' });
    } catch (error) {
        console.error('Log message error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to log message',
            error: error.message 
        });
    }
};

/**
 * Submit feedback for chatbot response
 */
exports.submitFeedback = async (req, res) => {
    try {
        const { sessionId, contentId, searchQuery, feedbackType, feedbackText, rating } = req.body;

        if (!sessionId || !feedbackType) {
            return res.status(400).json({ 
                message: 'Session ID and feedback type are required' 
            });
        }

        const validFeedbackTypes = ['helpful', 'not_helpful', 'irrelevant', 'inaccurate'];
        if (!validFeedbackTypes.includes(feedbackType)) {
            return res.status(400).json({ message: 'Invalid feedback type' });
        }

        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const { pool } = require('../config/database');

        await pool.query(
            `INSERT INTO chatbot_feedback 
            (session_id, content_id, search_query, feedback_type, feedback_text, rating)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                sessionId,
                contentId || null,
                searchQuery || null,
                feedbackType,
                feedbackText || null,
                rating || null
            ]
        );

        res.json({ success: true, message: 'Feedback submitted successfully' });
    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to submit feedback',
            error: error.message 
        });
    }
};

/**
 * Helper function to detect device type from user agent
 */
function detectDevice(userAgent) {
    const ua = userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipad|phone/i.test(ua)) {
        return 'mobile';
    } else if (/tablet|ipad/i.test(ua)) {
        return 'tablet';
    } else {
        return 'desktop';
    }
}

/**
 * Autocomplete for search input
 */
exports.autocomplete = async (req, res) => {
    try {
        const { query } = req.query;
        const limit = parseInt(req.query.limit) || 5;

        if (!query || query.trim().length < 2) {
            return res.json({ success: true, suggestions: [] });
        }

        const suggestions = await ChatbotSearchService.autocomplete(query, { limit });

        res.json({
            success: true,
            query,
            suggestions,
            count: suggestions.length
        });
    } catch (error) {
        console.error('Autocomplete error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Autocomplete failed',
            error: error.message 
        });
    }
};

/**
 * Get related content for a specific content item
 */
exports.getRelatedContent = async (req, res) => {
    try {
        const { contentId } = req.params;
        const limit = parseInt(req.query.limit) || 5;

        if (!contentId) {
            return res.status(400).json({ message: 'Content ID is required' });
        }

        const relatedContent = await RecommendationService.getRelatedContent(contentId, { limit });

        res.json({
            success: true,
            contentId,
            relatedContent,
            count: relatedContent.length
        });
    } catch (error) {
        console.error('Get related content error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get related content',
            error: error.message 
        });
    }
};

/**
 * Get no result suggestions when search returns empty
 */
exports.getNoResultSuggestions = async (req, res) => {
    try {
        const { query } = req.query;
        const limit = parseInt(req.query.limit) || 5;

        if (!query) {
            return res.status(400).json({ message: 'Query is required' });
        }

        const suggestions = await RecommendationService.getNoResultSuggestions(query, { limit });

        res.json({
            success: true,
            query,
            suggestions,
            count: suggestions.length
        });
    } catch (error) {
        console.error('Get no result suggestions error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get suggestions',
            error: error.message 
        });
    }
};

/**
 * Get related category/tag suggestions based on query
 */
exports.getRelatedSuggestions = async (req, res) => {
    try {
        const { query } = req.query;
        const limit = parseInt(req.query.limit) || 5;

        if (!query) {
            return res.status(400).json({ message: 'Query is required' });
        }

        const lowerQuery = query.toLowerCase();
        const suggestions = [];

        // 1. Search for matching categories
        const categories = await Category.findAll();
        const matchingCategories = categories.filter(cat => 
            cat.name.toLowerCase().includes(lowerQuery) ||
            cat.slug.toLowerCase().includes(lowerQuery)
        ).slice(0, Math.ceil(limit / 2));

        matchingCategories.forEach(cat => {
            suggestions.push({
                type: 'category',
                id: cat.id,
                name: cat.name,
                slug: cat.slug
            });
        });

        // 2. Search for matching tags from published content
        if (suggestions.length < limit) {
            const tagResults = await Content.getPopularTags(limit - suggestions.length);
            const matchingTags = tagResults.filter(tag => 
                tag.tag.toLowerCase().includes(lowerQuery)
            );

            matchingTags.forEach(tag => {
                suggestions.push({
                    type: 'tag',
                    name: tag.tag,
                    count: tag.count
                });
            });
        }

        // 3. Add trending categories if still need more
        if (suggestions.length < limit) {
            const trendingCategories = categories.slice(0, limit - suggestions.length);
            trendingCategories.forEach(cat => {
                if (!suggestions.find(s => s.id === cat.id)) {
                    suggestions.push({
                        type: 'category',
                        id: cat.id,
                        name: cat.name,
                        slug: cat.slug
                    });
                }
            });
        }

        res.json({
            success: true,
            query,
            suggestions: suggestions.slice(0, limit),
            count: suggestions.length
        });
    } catch (error) {
        console.error('Get related suggestions error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get related suggestions',
            error: error.message 
        });
    }
};

/**
 * Detect intent from user query
 */
exports.detectIntent = async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ message: 'Query is required' });
        }

        const intentResult = detectIntent(query);

        // If intent is website_question, include the knowledge base answer
        if (intentResult.intent === 'website_question' && !intentResult.answer) {
            const kbAnswer = searchKnowledgeBase(query);
            if (kbAnswer) {
                intentResult.answer = kbAnswer;
            }
        }

        res.json({
            success: true,
            query,
            intent: intentResult
        });
    } catch (error) {
        console.error('Detect intent error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to detect intent',
            error: error.message 
        });
    }
};

/**
 * Submit a user query for admin review
 */
exports.submitQuery = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, query } = req.body;

        if (!email || !query) {
            return res.status(400).json({ message: 'Email and query are required' });
        }

        // Validate business email - block free email providers
        const FREE_EMAIL_DOMAINS = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
            'aol.com', 'ymail.com', 'mail.com', 'protonmail.com', 'icloud.com',
            'zoho.com', 'gmx.com', 'yandex.com', 'rediffmail.com', 'inbox.com'
        ];

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        const domain = email.split('@')[1].toLowerCase();
        if (FREE_EMAIL_DOMAINS.includes(domain)) {
            return res.status(400).json({ 
                message: 'Free email providers are not allowed. Please use your business email address.' 
            });
        }

        const chatbotQuery = await ChatbotQuery.create({ email, query });

        // Send email notification to admin
        const adminEmail = process.env.ADMIN_EMAIL || 'info@tgstechinfo.com';
        const submittedAt = new Date().toLocaleString();
        const emailHtml = chatbotQueryAdminTemplate(email, query, submittedAt);
        
        try {
            await sendEmail(adminEmail, 'New Chatbot Query Received', emailHtml);
        } catch (emailError) {
            console.error('Failed to send admin email notification:', emailError);
            // Don't fail the request if email fails
        }

        res.json({
            success: true,
            message: 'Query submitted successfully',
            query: chatbotQuery
        });
    } catch (error) {
        console.error('Submit query error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to submit query',
            error: error.message 
        });
    }
};

/**
 * Get all queries (admin only)
 */
exports.getQueries = async (req, res) => {
    try {
        const { status, limit } = req.query;
        const filters = {};
        
        if (status) filters.status = status;
        if (limit) filters.limit = parseInt(limit);

        const queries = await ChatbotQuery.findAll(filters);

        res.json({
            success: true,
            queries,
            count: queries.length
        });
    } catch (error) {
        console.error('Get queries error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get queries',
            error: error.message 
        });
    }
};

/**
 * Get query statistics (admin only)
 */
exports.getQueryStats = async (req, res) => {
    try {
        const stats = await ChatbotQuery.getStats();

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Get query stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get query statistics',
            error: error.message 
        });
    }
};

/**
 * Update query status and add admin response (admin only)
 */
exports.updateQuery = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_response } = req.body;

        if (!['pending', 'answered', 'closed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const updated = await ChatbotQuery.updateStatus(id, status, admin_response);

        if (!updated) {
            return res.status(404).json({ message: 'Query not found' });
        }

        // Send email to user if status is 'answered' and admin_response is provided
        if (status === 'answered' && admin_response) {
            const queryData = await ChatbotQuery.findById(id);
            if (queryData) {
                const emailHtml = chatbotQueryResponseTemplate(queryData.query, admin_response);
                try {
                    await sendEmail(queryData.email, 'Response to Your Chatbot Query', emailHtml);
                } catch (emailError) {
                    console.error('Failed to send user email notification:', emailError);
                    // Don't fail the request if email fails
                }
            }
        }

        res.json({
            success: true,
            message: 'Query updated successfully'
        });
    } catch (error) {
        console.error('Update query error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update query',
            error: error.message 
        });
    }
};
