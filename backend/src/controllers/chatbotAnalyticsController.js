const ChatbotAnalyticsService = require('../services/chatbotAnalyticsService');

/**
 * Chatbot Analytics Controller
 * Handles admin analytics for the Content Discovery Assistant
 */

exports.getDashboard = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const analytics = await ChatbotAnalyticsService.getDashboardAnalytics({
            startDate,
            endDate
        });

        res.json({
            success: true,
            analytics
        });
    } catch (error) {
        console.error('Get dashboard analytics error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get dashboard analytics',
            error: error.message 
        });
    }
};

exports.getTopSearches = async (req, res) => {
    try {
        const { startDate, endDate, limit } = req.query;
        
        const topSearches = await ChatbotAnalyticsService.getTopSearches({
            startDate,
            endDate,
            limit: parseInt(limit) || 10
        });

        res.json({
            success: true,
            topSearches,
            count: topSearches.length
        });
    } catch (error) {
        console.error('Get top searches error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get top searches',
            error: error.message 
        });
    }
};

exports.getTopCategories = async (req, res) => {
    try {
        const { startDate, endDate, limit } = req.query;
        
        const topCategories = await ChatbotAnalyticsService.getTopCategories({
            startDate,
            endDate,
            limit: parseInt(limit) || 10
        });

        res.json({
            success: true,
            topCategories,
            count: topCategories.length
        });
    } catch (error) {
        console.error('Get top categories error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get top categories',
            error: error.message 
        });
    }
};

exports.getMostClicked = async (req, res) => {
    try {
        const { startDate, endDate, limit } = req.query;
        
        const mostClicked = await ChatbotAnalyticsService.getMostClickedContent({
            startDate,
            endDate,
            limit: parseInt(limit) || 10
        });

        res.json({
            success: true,
            mostClicked,
            count: mostClicked.length
        });
    } catch (error) {
        console.error('Get most clicked error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get most clicked content',
            error: error.message 
        });
    }
};

exports.getNoResultSearches = async (req, res) => {
    try {
        const { startDate, endDate, limit } = req.query;
        
        const noResultSearches = await ChatbotAnalyticsService.getNoResultSearches({
            startDate,
            endDate,
            limit: parseInt(limit) || 10
        });

        res.json({
            success: true,
            noResultSearches,
            count: noResultSearches.length
        });
    } catch (error) {
        console.error('Get no result searches error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get no result searches',
            error: error.message 
        });
    }
};

exports.getSessionAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const sessionStats = await ChatbotAnalyticsService.getSessionAnalytics({
            startDate,
            endDate
        });

        res.json({
            success: true,
            sessionStats
        });
    } catch (error) {
        console.error('Get session analytics error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get session analytics',
            error: error.message 
        });
    }
};

exports.getAverageSessionTime = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const avgSessionTime = await ChatbotAnalyticsService.getAverageSessionTime({
            startDate,
            endDate
        });

        res.json({
            success: true,
            avgSessionTime
        });
    } catch (error) {
        console.error('Get average session time error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get average session time',
            error: error.message 
        });
    }
};

exports.getCTR = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const ctr = await ChatbotAnalyticsService.getCTR({
            startDate,
            endDate
        });

        res.json({
            success: true,
            ctr
        });
    } catch (error) {
        console.error('Get CTR error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get CTR',
            error: error.message 
        });
    }
};

exports.getDailyAnalytics = async (req, res) => {
    try {
        const { days } = req.query;
        
        const dailyAnalytics = await ChatbotAnalyticsService.getDailyAnalytics({
            days: parseInt(days) || 30
        });

        res.json({
            success: true,
            dailyAnalytics,
            count: dailyAnalytics.length
        });
    } catch (error) {
        console.error('Get daily analytics error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get daily analytics',
            error: error.message 
        });
    }
};

exports.getMonthlyAnalytics = async (req, res) => {
    try {
        const { months } = req.query;
        
        const monthlyAnalytics = await ChatbotAnalyticsService.getMonthlyAnalytics({
            months: parseInt(months) || 12
        });

        res.json({
            success: true,
            monthlyAnalytics,
            count: monthlyAnalytics.length
        });
    } catch (error) {
        console.error('Get monthly analytics error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get monthly analytics',
            error: error.message 
        });
    }
};

exports.getFeedbackAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const feedbackAnalytics = await ChatbotAnalyticsService.getFeedbackAnalytics({
            startDate,
            endDate
        });

        res.json({
            success: true,
            feedbackAnalytics,
            count: feedbackAnalytics.length
        });
    } catch (error) {
        console.error('Get feedback analytics error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get feedback analytics',
            error: error.message 
        });
    }
};
