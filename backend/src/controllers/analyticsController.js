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

// Get content type breakdown by views
exports.getContentTypeBreakdown = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        const pool = require('../config/database').pool;

        const isAllTime = !start_date && !end_date;
        const startDateTime = start_date ? `${start_date} 00:00:00` : '1970-01-01 00:00:00';
        const endDateTime = end_date ? `${end_date} 23:59:59` : new Date().toISOString().replace('T', ' ').substring(0, 19);

        console.log('getContentTypeBreakdown called with:', { start_date, end_date, isAllTime, startDateTime, endDateTime });

        // Debug: Check what content types exist in the database
        const debugQuery = `
            SELECT ct.slug, ct.name, COUNT(c.id) as content_count
            FROM content_types ct
            LEFT JOIN contents c ON ct.id = c.content_type_id AND c.status = 'published'
            GROUP BY ct.slug, ct.name
            ORDER BY ct.slug
        `;
        const [debugRows] = await pool.query(debugQuery);
        console.log('Debug - Content types in database:', debugRows);

        // Always get view_count totals (all-time cumulative counter on contents table)
        const viewCountQuery = `
            SELECT ct.slug as content_type, ct.name as content_type_name,
                SUM(c.view_count) as total_views, COUNT(c.id) as content_count
            FROM contents c
            JOIN content_types ct ON c.content_type_id = ct.id
            WHERE c.status = 'published'
            GROUP BY ct.slug, ct.name
            ORDER BY total_views DESC
        `;

        // Period-specific page_views (linked by content_id)
        const periodLinkedQuery = `
            SELECT ct.slug as content_type, COUNT(DISTINCT pv.id) as period_views
            FROM contents c
            JOIN content_types ct ON c.content_type_id = ct.id
            JOIN page_views pv ON c.id = pv.content_id
                AND pv.entered_at >= ? AND pv.entered_at <= ?
            WHERE c.status = 'published'
            GROUP BY ct.slug
        `;

        // Period-specific page_views (matched by URL pattern)
        const periodUrlQuery = `
            SELECT ct.slug as content_type, COUNT(DISTINCT pv.id) as period_views
            FROM contents c
            JOIN content_types ct ON c.content_type_id = ct.id
            JOIN page_views pv ON (
                pv.page_url REGEXP CONCAT('/(article|blog|news|interview|ebook|whitepaper|report|case-study|guide|webinar|event)/', c.id, '($|[/?#])')
                OR pv.page_url LIKE CONCAT('%/', CONVERT(c.slug USING utf8mb4) COLLATE utf8mb4_unicode_ci)
                OR pv.page_url LIKE CONCAT('%/', CONVERT(c.slug USING utf8mb4) COLLATE utf8mb4_unicode_ci, '?%')
            )
            AND pv.content_id IS NULL
            AND pv.entered_at >= ? AND pv.entered_at <= ?
            WHERE c.status = 'published'
            GROUP BY ct.slug
        `;

        // Total page_views in the period (for scaling)
        const periodTotalQuery = `
            SELECT COUNT(*) as total FROM page_views
            WHERE entered_at >= ? AND entered_at <= ?
        `;

        // All-time total page_views (for scaling ratio)
        const allTimeTotalQuery = `SELECT COUNT(*) as total FROM page_views`;

        const [[viewCountRows], [periodLinkedRows], [periodUrlRows], [periodTotalRows], [allTimeTotalRows]] = await Promise.all([
            pool.query(viewCountQuery),
            pool.query(periodLinkedQuery, [startDateTime, endDateTime]),
            pool.query(periodUrlQuery, [startDateTime, endDateTime]),
            pool.query(periodTotalQuery, [startDateTime, endDateTime]),
            pool.query(allTimeTotalQuery),
        ]);

        const periodTotal = Number(periodTotalRows[0]?.total || 0);
        const allTimeTotal = Number(allTimeTotalRows[0]?.total || 1);
        // Ratio of period traffic vs all-time traffic
        const periodRatio = isAllTime ? 1 : Math.min(1, periodTotal / allTimeTotal);

        // Build period views map from actual tracked data
        const periodViewsMap = {};
        for (const row of [...periodLinkedRows, ...periodUrlRows]) {
            const key = row.content_type;
            periodViewsMap[key] = (periodViewsMap[key] || 0) + Number(row.period_views);
        }

        const insightsTypes = ['article', 'news', 'interview', 'ebook', 'whitepaper', 'case-study', 'report', 'guide'];
        const resourcesTypes = ['blog', 'webinar', 'event', 'video', 'podcast'];

        const insightsItems = [];
        const resourcesItems = [];
        let insightsTotal = 0;
        let resourcesTotal = 0;

        for (const row of viewCountRows) {
            const type = row.content_type || 'article';
            const allTimeViews = Number(row.total_views || 0);

            // Use actual period tracked views if available, otherwise scale view_count by period ratio
            const trackedPeriodViews = periodViewsMap[type] || 0;
            const scaledViews = trackedPeriodViews > 0
                ? trackedPeriodViews
                : Math.round(allTimeViews * periodRatio);

            const views = isAllTime ? allTimeViews : scaledViews;

            if (insightsTypes.includes(type)) {
                insightsTotal += views;
                insightsItems.push({ label: row.content_type_name || type, views, content_type: type });
            } else if (resourcesTypes.includes(type)) {
                resourcesTotal += views;
                resourcesItems.push({ label: row.content_type_name || type, views, content_type: type });
            }
        }

        res.json({ insightsItems, resourcesItems, insightsTotal, resourcesTotal });
    } catch (error) {
        console.error('Get content type breakdown error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

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
                AND DATE(ce.created_at) >= ? AND DATE(ce.created_at) <= ?
            LEFT JOIN page_views pv ON c.id = pv.content_id
                AND DATE(pv.entered_at) >= ? AND DATE(pv.entered_at) <= ?
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            WHERE c.status = 'published'
            GROUP BY c.id, c.title, c.slug, c.view_count, ct.slug
            HAVING COUNT(DISTINCT ce.id) > 0 OR COUNT(DISTINCT pv.id) > 0
            ORDER BY (COUNT(DISTINCT ce.id) + COUNT(DISTINCT pv.id)) DESC
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
