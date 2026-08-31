const VisitorSession = require('../models/VisitorSession');
const PageView = require('../models/PageView');
const ContentEngagement = require('../models/ContentEngagement');
const Download = require('../models/Download');
const SearchHistory = require('../models/SearchHistory');
const VideoProgress = require('../models/VideoProgress');
const CtaClick = require('../models/CtaClick');
const NewsletterEvent = require('../models/NewsletterEvent');
const CoreWebVitals = require('../models/CoreWebVitals');
const UserJourney = require('../models/UserJourney');
const Content = require('../models/Content');

// Get overall analytics overview
exports.getOverview = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        const filters = {};
        if (start_date) filters.start_date = start_date;
        if (end_date) filters.end_date = end_date;

        // Get session analytics - aggregate without grouping
        let baseWhere = ' WHERE 1=1';
        const values = [];

        if (filters.start_date) {
            baseWhere += ' AND session_start >= ?';
            values.push(filters.start_date);
        }
        if (filters.end_date) {
            baseWhere += ' AND session_start <= ?';
            values.push(filters.end_date);
        }

        const sessionQuery = `
            SELECT 
                COUNT(*) as totalSessions,
                AVG(total_session_duration) as avgSessionDuration,
                AVG(total_pages_visited) as avgPagesPerSession,
                COUNT(DISTINCT ip_address) as uniqueVisitors,
                SUM(CASE WHEN total_pages_visited = 1 THEN 1 ELSE 0 END) as bounceCount
            FROM visitor_sessions
            ${baseWhere}
        `;
        const [sessionRows] = await require('../config/database').pool.query(sessionQuery, values);

        const sessionData = sessionRows[0] || {};
        const totalSessions = sessionData.totalSessions || 0;
        const bounceRate = totalSessions > 0 ? Math.round((sessionData.bounceCount / totalSessions) * 100) : 0;

        const sessionAnalytics = {
            totalSessions: totalSessions,
            avgSessionDuration: Math.round(sessionData.avgSessionDuration || 0),
            avgPagesPerSession: Math.round(sessionData.avgPagesPerSession || 0),
            uniqueVisitors: sessionData.uniqueVisitors || 0,
            bounceRate: bounceRate,
        };

        // Get daily sessions for chart
        const dailySessionsQuery = `
            SELECT 
                DATE(session_start) as date,
                COUNT(*) as session_count
            FROM visitor_sessions
            ${baseWhere}
            GROUP BY DATE(session_start)
            ORDER BY date ASC
        `;
        const [dailySessionsRows] = await require('../config/database').pool.query(dailySessionsQuery, values);
        sessionAnalytics.dailySessions = dailySessionsRows;

        // Get landing pages data with real conversion counts
        const landingPagesQuery = `
            SELECT 
                vs.landing_page,
                COUNT(*) as session_count,
                COALESCE(COUNT(DISTINCT c.id), 0) as conversion_count
            FROM visitor_sessions vs
            LEFT JOIN conversions c ON vs.session_uuid = c.session_uuid 
                AND c.created_at >= COALESCE(?, '1970-01-01')
                AND c.created_at <= COALESCE(?, NOW())
            ${baseWhere}
            GROUP BY vs.landing_page
            ORDER BY session_count DESC
            LIMIT 5
        `;
        const landingPagesValues = [start_date || '1970-01-01', end_date || new Date(), ...values];
        const [landingPagesRows] = await require('../config/database').pool.query(landingPagesQuery, landingPagesValues);
        sessionAnalytics.landingPages = landingPagesRows;

        // Get total page views
        const pageViewQuery = `
            SELECT COUNT(*) as total_page_views
            FROM page_views
            WHERE entered_at >= COALESCE(?, '1970-01-01')
            AND entered_at <= COALESCE(?, NOW())
        `;
        const [pageViewRows] = await require('../config/database').pool.query(pageViewQuery, [start_date || '1970-01-01', end_date || new Date()]);

        // Get total engagements and engagement metrics
        const engagementQuery = `
            SELECT 
                COUNT(*) as total_engagements,
                AVG(reading_time_seconds) as avg_read_time,
                AVG(scroll_depth) as avg_scroll_depth,
                SUM(CASE WHEN reading_completed = TRUE THEN 1 ELSE 0 END) as completed_reads,
                COUNT(DISTINCT content_id) as unique_content_engaged
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

        const engagementData = engagementRows[0] || {};
        
        res.json({
            sessionAnalytics,
            totalPageViews: pageViewRows[0].total_page_views,
            totalEngagements: engagementData.total_engagements || 0,
            avgReadTime: engagementData.avg_read_time || 0,
            scrollDepth: engagementData.avg_scroll_depth || 0,
            completedReads: engagementData.completed_reads || 0,
            uniqueContentEngaged: engagementData.unique_content_engaged || 0,
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

// Get top content by engagement
exports.getTopContentByEngagement = async (req, res) => {
    try {
        const { start_date, end_date, limit = 10 } = req.query;
        const pool = require('../config/database').pool;

        const hasDateFilter = start_date && end_date;
        const startVal = start_date || '1970-01-01';
        const endVal = end_date || new Date().toISOString().split('T')[0];

        const query = `
            SELECT 
                c.id,
                c.title,
                c.slug,
                c.view_count,
                ct.slug as content_type,
                COUNT(DISTINCT ce.id) as engagement_count,
                AVG(ce.reading_time_seconds) as avg_reading_time,
                AVG(ce.scroll_depth) as avg_scroll_depth,
                SUM(CASE WHEN ce.reading_completed = TRUE THEN 1 ELSE 0 END) as completed_reads,
                COUNT(DISTINCT pv.id) as period_views
            FROM contents c
            LEFT JOIN content_engagement ce ON c.id = ce.content_id
                AND ce.created_at >= ? AND ce.created_at <= ?
            LEFT JOIN page_views pv ON c.id = pv.content_id
                AND pv.entered_at >= ? AND pv.entered_at <= ?
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            WHERE c.status = 'published'
            GROUP BY c.id, c.title, c.slug, c.view_count, ct.slug
            HAVING engagement_count > 0 OR period_views > 0
            ORDER BY (engagement_count + period_views) DESC
            LIMIT ?
        `;

        const [rows] = await pool.query(query, [startVal, endVal, startVal, endVal, parseInt(limit)]);
        
        res.json({
            topContent: rows.map(row => ({
                id: row.id,
                title: row.title,
                slug: row.slug,
                views: row.period_views || 0,
                contentType: row.content_type,
                engagementCount: row.engagement_count || 0,
                avgReadingTime: Math.round(row.avg_reading_time || 0),
                avgScrollDepth: Math.round(row.avg_scroll_depth || 0),
                completedReads: row.completed_reads || 0,
                readRate: row.engagement_count > 0 
                    ? Math.round((row.completed_reads / row.engagement_count) * 100) 
                    : 0
            }))
        });
    } catch (error) {
        console.error('Get top content by engagement error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get session analytics
exports.getSessionAnalytics = async (req, res) => {
    try {
        const { start_date, end_date, limit = 500 } = req.query;

        console.log('getSessionAnalytics - Request params:', { start_date, end_date, limit });

        const filters = {};
        if (start_date) filters.start_date = start_date;
        if (end_date) filters.end_date = end_date;

        const analytics = await VisitorSession.getAnalytics(filters);

        // Get recent sessions
        let recentSessionsQuery = `
            SELECT 
                session_uuid,
                session_start,
                session_end,
                total_session_duration,
                total_pages_visited,
                country,
                device_type,
                browser,
                operating_system,
                screen_resolution,
                landing_page,
                exit_page,
                referrer
            FROM visitor_sessions
        `;
        
        const queryParams = [];
        
        if (start_date || end_date) {
            recentSessionsQuery += ` WHERE 1=1`;
            if (start_date) {
                recentSessionsQuery += ` AND session_start >= ?`;
                queryParams.push(start_date);
            }
            if (end_date) {
                recentSessionsQuery += ` AND session_start <= ?`;
                queryParams.push(end_date);
            }
        }
        
        recentSessionsQuery += ` ORDER BY session_start DESC LIMIT ?`;
        queryParams.push(parseInt(limit));

        console.log('getSessionAnalytics - Query:', recentSessionsQuery);
        console.log('getSessionAnalytics - Query params:', queryParams);
        
        const [recentSessions] = await require('../config/database').pool.query(
            recentSessionsQuery,
            queryParams
        );

        console.log('getSessionAnalytics - Sessions returned:', recentSessions.length);

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

        console.log('getSearchAnalytics - Request params:', { limit, start_date, end_date });

        const filters = {};
        if (start_date) filters.start_date = start_date;
        if (end_date) filters.end_date = end_date;

        console.log('getSearchAnalytics - Filters:', filters);

        const popularSearches = await SearchHistory.getPopularSearches(parseInt(limit), filters);
        const searchAnalytics = await SearchHistory.getSearchAnalytics(filters);

        console.log('getSearchAnalytics - Popular searches returned:', popularSearches.length);
        console.log('getSearchAnalytics - Search analytics returned:', searchAnalytics.length);

        res.json({
            popularSearches,
            searchAnalytics
        });
    } catch (error) {
        console.error('Get search analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get Core Web Vitals analytics
exports.getCoreWebVitalsAnalytics = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        console.log('getCoreWebVitalsAnalytics - Request params:', { start_date, end_date });

        const filters = {};
        if (start_date) filters.start_date = start_date;
        if (end_date) filters.end_date = end_date;

        const aggregatedMetrics = await CoreWebVitals.getAggregatedMetrics(filters);
        const metricsByPage = await CoreWebVitals.getMetricsByPage(filters, 10);

        console.log('getCoreWebVitalsAnalytics - Aggregated metrics:', aggregatedMetrics);
        console.log('getCoreWebVitalsAnalytics - Metrics by page:', metricsByPage.length);

        res.json({
            aggregatedMetrics,
            metricsByPage
        });
    } catch (error) {
        console.error('Get Core Web Vitals analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Record Core Web Vitals
exports.recordCoreWebVitals = async (req, res) => {
    try {
        const cwvData = req.body;

        console.log('recordCoreWebVitals - Data received:', cwvData);

        const cwv = await CoreWebVitals.create(cwvData);

        console.log('recordCoreWebVitals - CWV created successfully:', cwv);

        res.json({
            success: true,
            cwv
        });
    } catch (error) {
        console.error('Record Core Web Vitals error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create Core Web Vitals table (migration)
exports.createCoreWebVitalsTable = async (req, res) => {
    try {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS core_web_vitals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_uuid VARCHAR(255) NOT NULL,
                consent_uuid VARCHAR(255),
                
                -- Core Web Vitals Metrics
                lcp DECIMAL(10, 2) COMMENT 'Largest Contentful Paint (seconds)',
                fid INT COMMENT 'First Input Delay (milliseconds)',
                cls DECIMAL(10, 4) COMMENT 'Cumulative Layout Shift',
                ttfb INT COMMENT 'Time to First Byte (milliseconds)',
                fcp DECIMAL(10, 2) COMMENT 'First Contentful Paint (seconds)',
                inp INT COMMENT 'Interaction to Next Paint (milliseconds)',
                
                -- Additional Performance Metrics
                dom_content_loaded_time INT COMMENT 'DOM Content Loaded (milliseconds)',
                load_complete_time INT COMMENT 'Load Complete (milliseconds)',
                total_resources INT COMMENT 'Total number of resources loaded',
                
                -- Context
                page_url VARCHAR(500),
                page_title VARCHAR(255),
                device_type VARCHAR(50),
                browser VARCHAR(100),
                
                -- Timestamps
                measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Indexes
                INDEX idx_session_uuid (session_uuid),
                INDEX idx_measured_at (measured_at),
                INDEX idx_page_url (page_url(255))
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;

        await require('../config/database').pool.query(createTableSQL);

        console.log('Core Web Vitals table created successfully');

        res.json({
            success: true,
            message: 'Core Web Vitals table created successfully'
        });
    } catch (error) {
        console.error('Create Core Web Vitals table error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get user journey analytics
exports.getJourneyAnalytics = async (req, res) => {
    try {
        const { limit = 10, start_date, end_date } = req.query;

        const filters = {};
        if (start_date) filters.start_date = start_date;
        if (end_date) filters.end_date = end_date;

        const popularJourneys = await UserJourney.getPopularJourneys(parseInt(limit), filters);
        const conversionFunnel = await UserJourney.getConversionFunnel(filters);

        // Calculate total sessions from funnel data
        const totalSessions = conversionFunnel.length > 0 ? (conversionFunnel[0].count || 0) : 0;

        res.json({
            funnel: conversionFunnel,
            totalSessions,
            popularJourneys
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

        // Calculate total conversions from CTA data
        const totalConversions = ctaAnalytics.reduce((sum, cta) => sum + (cta.conversions || 0), 0);

        res.json({ 
            ctaClicks: ctaAnalytics,
            totalConversions 
        });
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
