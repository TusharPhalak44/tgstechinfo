const VisitorSession = require('../models/VisitorSession');
const PageView = require('../models/PageView');
const ContentEngagement = require('../models/ContentEngagement');
const Download = require('../models/Download');
const SearchHistory = require('../models/SearchHistory');
const VideoProgress = require('../models/VideoProgress');
const CtaClick = require('../models/CtaClick');
const NewsletterEvent = require('../models/NewsletterEvent');
const UserJourney = require('../models/UserJourney');
const Content = require('../models/Content');

// Get overall analytics overview
exports.getOverview = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        const filters = {};
        if (start_date) filters.start_date = start_date;
        if (end_date) filters.end_date = end_date;

        // Get session analytics
        const sessionAnalytics = await VisitorSession.getAnalytics(filters);

        // Get total page views
        const pageViewQuery = `
            SELECT COUNT(*) as total_page_views
            FROM page_views
            WHERE entered_at >= COALESCE(?, '1970-01-01')
            AND entered_at <= COALESCE(?, NOW())
        `;
        const [pageViewRows] = await require('../config/database').pool.query(pageViewQuery, [start_date || '1970-01-01', end_date || new Date()]);

        // Get total engagements
        const engagementQuery = `
            SELECT COUNT(*) as total_engagements
            FROM content_engagement
            WHERE created_at >= COALESCE(?, '1970-01-01')
            AND created_at <= COALESCE(?, NOW())
        `;
        const [engagementRows] = await require('../config/database').pool.query(engagementQuery, [start_date || '1970-01-01', end_date || new Date()]);

        // Get total downloads
        const downloadQuery = `
            SELECT COUNT(*) as total_downloads
            FROM downloads
            WHERE downloaded_at >= COALESCE(?, '1970-01-01')
            AND downloaded_at <= COALESCE(?, NOW())
        `;
        const [downloadRows] = await require('../config/database').pool.query(downloadQuery, [start_date || '1970-01-01', end_date || new Date()]);

        // Get CTA clicks
        const ctaQuery = `
            SELECT cta_type, COUNT(*) as click_count
            FROM cta_clicks
            WHERE clicked_at >= COALESCE(?, '1970-01-01')
            AND clicked_at <= COALESCE(?, NOW())
            GROUP BY cta_type
        `;
        const [ctaRows] = await require('../config/database').pool.query(ctaQuery, [start_date || '1970-01-01', end_date || new Date()]);

        res.json({
            sessionAnalytics,
            totalPageViews: pageViewRows[0].total_page_views,
            totalEngagements: engagementRows[0].total_engagements,
            totalDownloads: downloadRows[0].total_downloads,
            ctaClicks: ctaRows
        });
    } catch (error) {
        console.error('Get overview error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get content-specific analytics
exports.getContentAnalytics = async (req, res) => {
    try {
        const { content_id } = req.params;
        const { start_date, end_date } = req.query;

        const filters = { contentId };
        if (start_date) filters.start_date = start_date;
        if (end_date) filters.end_date = end_date;

        // Get page view analytics
        const pageViewStats = await PageView.getContentAnalytics(content_id, filters);

        // Get content engagement stats
        const engagementStats = await ContentEngagement.getContentStats(content_id);

        // Get download stats
        const downloadStats = await Download.getDownloadStats(content_id);

        // Get CTA stats
        const ctaStats = await CtaClick.getCtaStats(content_id);

        // Get video stats if applicable
        const videoStats = await VideoProgress.getContentStats(content_id);

        res.json({
            pageViewStats,
            engagementStats,
            downloadStats,
            ctaStats,
            videoStats
        });
    } catch (error) {
        console.error('Get content analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get session analytics
exports.getSessionAnalytics = async (req, res) => {
    try {
        const { start_date, end_date, limit = 50 } = req.query;

        const filters = {};
        if (start_date) filters.start_date = start_date;
        if (end_date) filters.end_date = end_date;

        const analytics = await VisitorSession.getAnalytics(filters);

        // Get recent sessions
        const recentSessionsQuery = `
            SELECT 
                session_uuid,
                session_start,
                session_end,
                total_session_duration,
                total_pages_visited,
                country,
                device_type,
                browser,
                landing_page,
                exit_page
            FROM visitor_sessions
            WHERE session_start >= COALESCE(?, '1970-01-01')
            AND session_start <= COALESCE(?, NOW())
            ORDER BY session_start DESC
            LIMIT ?
        `;
        const [recentSessions] = await require('../config/database').pool.query(
            recentSessionsQuery,
            [start_date || '1970-01-01', end_date || new Date(), parseInt(limit)]
        );

        res.json({
            analytics,
            recentSessions
        });
    } catch (error) {
        console.error('Get session analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get popular pages
exports.getPopularPages = async (req, res) => {
    try {
        const { limit = 10, start_date, end_date } = req.query;

        const filters = {};
        if (start_date) filters.start_date = start_date;
        if (end_date) filters.end_date = end_date;

        const popularPages = await PageView.getPopularPages(parseInt(limit), filters);

        res.json({ popularPages });
    } catch (error) {
        console.error('Get popular pages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get popular downloads
exports.getPopularDownloads = async (req, res) => {
    try {
        const { limit = 10, start_date, end_date } = req.query;

        const filters = {};
        if (start_date) filters.start_date = start_date;
        if (end_date) filters.end_date = end_date;

        const popularDownloads = await Download.getPopularDownloads(parseInt(limit), filters);

        res.json({ popularDownloads });
    } catch (error) {
        console.error('Get popular downloads error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get search analytics
exports.getSearchAnalytics = async (req, res) => {
    try {
        const { limit = 10, start_date, end_date } = req.query;

        const filters = {};
        if (start_date) filters.start_date = start_date;
        if (end_date) filters.end_date = end_date;

        const popularSearches = await SearchHistory.getPopularSearches(parseInt(limit), filters);
        const searchAnalytics = await SearchHistory.getSearchAnalytics(filters);

        res.json({
            popularSearches,
            searchAnalytics
        });
    } catch (error) {
        console.error('Get search analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user journey analytics
exports.getJourneyAnalytics = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const popularJourneys = await UserJourney.getPopularJourneys(parseInt(limit));
        const conversionFunnel = await UserJourney.getConversionFunnel();

        res.json({
            popularJourneys,
            conversionFunnel
        });
    } catch (error) {
        console.error('Get journey analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get CTA analytics
exports.getCtaAnalytics = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        const filters = {};
        if (start_date) filters.start_date = start_date;
        if (end_date) filters.end_date = end_date;

        const ctaAnalytics = await CtaClick.getCtaAnalytics(filters);

        res.json({ ctaAnalytics });
    } catch (error) {
        console.error('Get CTA analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get newsletter analytics
exports.getNewsletterAnalytics = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        const filters = {};
        if (start_date) filters.start_date = start_date;
        if (end_date) filters.end_date = end_date;

        const eventStats = await NewsletterEvent.getEventStats(filters);

        res.json({ eventStats });
    } catch (error) {
        console.error('Get newsletter analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
