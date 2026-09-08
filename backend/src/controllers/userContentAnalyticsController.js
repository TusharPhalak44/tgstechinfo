const ContentAnalytics = require('../models/ContentAnalytics');

// Get overview of all content analytics for the current user
exports.getUserContentOverview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { start_date, end_date } = req.query;

        const filters = {};
        if (start_date) filters.start_date = start_date;
        if (end_date) filters.end_date = end_date;

        // Get content stats
        const contentStats = await ContentAnalytics.getUserContentStats(userId, filters);
        
        // Get user summary
        const userSummary = await ContentAnalytics.getUserContentSummary(userId);

        res.json({
            user_summary: userSummary,
            content_stats: contentStats
        });
    } catch (error) {
        console.error('Get user content overview error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get detailed analytics for a specific content item
exports.getContentDetailAnalytics = async (req, res) => {
    try {
        const { content_id } = req.params;
        const userId = req.user.id;
        const { start_date, end_date } = req.query;

        const filters = {};
        if (start_date) filters.start_date = start_date;
        if (end_date) filters.end_date = end_date;

        const detailStats = await ContentAnalytics.getContentDetailStats(content_id, userId, filters);

        res.json(detailStats);
    } catch (error) {
        console.error('Get content detail analytics error:', error);
        if (error.message === 'Content not found') {
            return res.status(404).json({ message: 'Content not found' });
        }
        if (error.message === 'Access denied') {
            return res.status(403).json({ message: 'Access denied' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

// Get location-based analytics for specific content
exports.getContentLocationAnalytics = async (req, res) => {
    try {
        const { content_id } = req.params;
        const userId = req.user.id;

        const locationData = await ContentAnalytics.getContentByLocation(content_id, userId);

        res.json({
            content_id: parseInt(content_id),
            location_data: locationData
        });
    } catch (error) {
        console.error('Get content location analytics error:', error);
        if (error.message === 'Content not found') {
            return res.status(404).json({ message: 'Content not found' });
        }
        if (error.message === 'Access denied') {
            return res.status(403).json({ message: 'Access denied' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

// Get engagement details for specific content
exports.getContentEngagementAnalytics = async (req, res) => {
    try {
        const { content_id } = req.params;
        const userId = req.user.id;
        const { start_date, end_date } = req.query;

        const filters = {};
        if (start_date) filters.start_date = start_date;
        if (end_date) filters.end_date = end_date;

        const engagementData = await ContentAnalytics.getContentEngagementDetails(content_id, userId, filters);

        res.json({
            content_id: parseInt(content_id),
            engagement_data: engagementData
        });
    } catch (error) {
        console.error('Get content engagement analytics error:', error);
        if (error.message === 'Content not found') {
            return res.status(404).json({ message: 'Content not found' });
        }
        if (error.message === 'Access denied') {
            return res.status(403).json({ message: 'Access denied' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

// Get analytics summary for dashboard
exports.getDashboardSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('Fetching dashboard summary for user:', userId);

        const userSummary = await ContentAnalytics.getUserContentSummary(userId);
        console.log('User summary:', userSummary);

        const allContentStats = await ContentAnalytics.getUserContentStats(userId);
        console.log('All content stats count:', allContentStats?.length);

        // Get top performing content with real engagement
        const topContentQuery = `
            SELECT 
                c.id,
                c.title,
                c.slug,
                c.status,
                c.published_date,
                COALESCE(c.view_count, 0) as views,
                                (SELECT COUNT(DISTINCT ce.session_uuid) FROM content_engagement ce
                                 WHERE ce.content_id = c.id AND ce.engagement_type <> 'view'
                                     AND EXISTS (SELECT 1 FROM page_views pv
                                                             WHERE pv.content_id = c.id
                                                                 AND pv.session_uuid = ce.session_uuid)) as engagements,
                (SELECT COUNT(DISTINCT pv.session_uuid) FROM page_views pv
                 WHERE pv.content_id = c.id) as unique_visitors
            FROM contents c
            WHERE c.user_id = ?
            ORDER BY c.view_count DESC, c.created_at DESC
            LIMIT 10
        `;

        const [topContent] = await require('../config/database').pool.query(topContentQuery, [userId]);
        console.log('Top content count:', topContent?.length);

        res.json({
            user_summary: userSummary,
            all_content: allContentStats,
            top_content: topContent
        });
    } catch (error) {
        console.error('Get dashboard summary error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};