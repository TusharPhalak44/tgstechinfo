const { pool } = require('../config/database');

class ContentAnalytics {
    static async getUserContentStats(userId, filters = {}) {
        let where = ' WHERE c.user_id = ?';
        const values = [userId];
        if (filters.start_date) { where += ' AND c.created_at >= ?'; values.push(filters.start_date); }
        if (filters.end_date) { where += ' AND c.created_at <= ?'; values.push(filters.end_date); }
        const [rows] = await pool.query(`
            SELECT c.id AS content_id, c.title, c.slug, c.status, c.published_date,
                COALESCE(c.view_count, 0) AS total_views,
                (SELECT COUNT(DISTINCT pv.session_uuid) FROM page_views pv WHERE pv.content_id = c.id) AS unique_visitors,
                (SELECT COUNT(DISTINCT ce.session_uuid) FROM content_engagement ce
                 WHERE ce.content_id = c.id AND ce.engagement_type <> 'view'
                   AND EXISTS (SELECT 1 FROM page_views pv WHERE pv.content_id = c.id AND pv.session_uuid = ce.session_uuid)) AS total_engagements,
                (SELECT ROUND(AVG(ce.reading_time_seconds)) FROM content_engagement ce WHERE ce.content_id = c.id) AS avg_reading_time,
                (SELECT COUNT(*) FROM content_engagement ce WHERE ce.content_id = c.id AND ce.reading_completed = TRUE) AS completed_reads
            FROM contents c ${where}
            ORDER BY total_views DESC, c.created_at DESC`, values);
        return rows;
    }

    static async getContentDetailStats(contentId, userId) {
        const [contentRows] = await pool.query(`
            SELECT c.id AS content_id, c.user_id, c.title, c.slug, c.status,
                c.published_date, COALESCE(c.view_count, 0) AS total_views
            FROM contents c WHERE c.id = ? AND c.user_id = ?`, [contentId, userId]);
        if (!contentRows[0]) throw new Error('Content not found');

        const [visitorRows] = await pool.query(
            'SELECT COUNT(DISTINCT session_uuid) AS unique_visitors FROM page_views WHERE content_id = ?',
            [contentId]
        );
        const [engagementRows] = await pool.query(`
            SELECT COUNT(DISTINCT ce.session_uuid) AS total_engagements,
                ROUND(AVG(ce.reading_time_seconds)) AS avg_reading_time,
                ROUND(AVG(ce.scroll_depth)) AS avg_scroll_depth,
                COUNT(DISTINCT CASE WHEN ce.reading_completed = TRUE THEN ce.session_uuid END) AS completed_reads
            FROM content_engagement ce
            WHERE ce.content_id = ? AND ce.engagement_type <> 'view'
              AND EXISTS (SELECT 1 FROM page_views pv WHERE pv.content_id = ce.content_id AND pv.session_uuid = ce.session_uuid)`, [contentId]);
        const [downloadRows] = await pool.query(
            'SELECT COUNT(*) AS total_downloads FROM downloads WHERE content_id = ?',
            [contentId]
        ).catch(() => [[{ total_downloads: 0 }]]);

        const stats = {
            total_views: contentRows[0].total_views,
            unique_visitors: visitorRows[0]?.unique_visitors || 0,
            total_engagements: engagementRows[0]?.total_engagements || 0,
            avg_reading_time: engagementRows[0]?.avg_reading_time || 0,
            avg_scroll_depth: engagementRows[0]?.avg_scroll_depth || 0,
            completed_reads: engagementRows[0]?.completed_reads || 0,
            total_downloads: downloadRows[0]?.total_downloads || 0
        };

        const [locations] = await pool.query(`
            SELECT COALESCE(vs.country, 'Global / Unknown') AS country,
                COALESCE(vs.device_type, 'desktop') AS device_type,
                COALESCE(vs.browser, 'Unknown') AS browser,
                COALESCE(vs.operating_system, 'Unknown') AS operating_system,
                COUNT(DISTINCT pv.session_uuid) AS visitor_count,
                COUNT(*) AS page_views, MAX(pv.entered_at) AS last_viewed
            FROM page_views pv
            LEFT JOIN visitor_sessions vs ON pv.session_uuid = vs.session_uuid
            WHERE pv.content_id = ?
            GROUP BY COALESCE(vs.country, 'Global / Unknown'), COALESCE(vs.device_type, 'desktop'),
                COALESCE(vs.browser, 'Unknown'), COALESCE(vs.operating_system, 'Unknown')
            ORDER BY visitor_count DESC`, [contentId]);

        const [recent] = await pool.query(`
            SELECT pv.session_uuid, COALESCE(vs.country, 'Global / Unknown') AS country,
                COALESCE(vs.device_type, 'desktop') AS device_type,
                COALESCE(vs.browser, 'Unknown') AS browser,
                COALESCE(vs.ip_address, 'Unknown') AS ip_address,
                MAX(pv.entered_at) AS view_time, MAX(pv.page_title) AS page_title
            FROM page_views pv
            LEFT JOIN visitor_sessions vs ON pv.session_uuid = vs.session_uuid
            WHERE pv.content_id = ?
            GROUP BY pv.session_uuid, COALESCE(vs.country, 'Global / Unknown'),
                COALESCE(vs.device_type, 'desktop'), COALESCE(vs.browser, 'Unknown'),
                COALESCE(vs.ip_address, 'Unknown')
            ORDER BY view_time DESC LIMIT 20`, [contentId]);

        const [daily] = await pool.query(`
            SELECT DATE(entered_at) AS date, COUNT(DISTINCT session_uuid) AS daily_views,
                COUNT(*) AS total_page_views
            FROM page_views WHERE content_id = ?
            GROUP BY DATE(entered_at) ORDER BY date ASC`, [contentId]);

        return { ...contentRows[0], stats, locations, daily_views: daily, recent_visitors: recent };
    }

    static async getUserContentSummary(userId) {
        const [rows] = await pool.query(`
            SELECT COUNT(CASE WHEN c.status IN ('published', 'approved') THEN 1 END) AS total_published,
                COUNT(CASE WHEN c.status = 'draft' THEN 1 END) AS total_drafts,
                COUNT(CASE WHEN c.status = 'pending' THEN 1 END) AS pending_review,
                COALESCE(SUM(c.view_count), 0) AS total_views_all_content,
                COALESCE((SELECT COUNT(DISTINCT pv.session_uuid) FROM page_views pv
                    JOIN contents c2 ON pv.content_id = c2.id WHERE c2.user_id = ?), 0) AS total_unique_visitors
            FROM contents c WHERE c.user_id = ?`, [userId, userId]);
        return rows[0] || {};
    }

    static async getContentByLocation(contentId, userId) {
        const detail = await this.getContentDetailStats(contentId, userId);
        return detail.locations;
    }

    static async getContentEngagementDetails(contentId, userId, filters = {}) {
        const [checks] = await pool.query('SELECT user_id FROM contents WHERE id = ?', [contentId]);
        if (!checks[0]) throw new Error('Content not found');
        if (checks[0].user_id !== parseInt(userId)) throw new Error('Access denied');
        let where = " WHERE ce.content_id = ? AND ce.engagement_type IN ('read', 'download', 'share', 'bookmark', 'print', 'copy_link')";
        const values = [contentId];
        if (filters.start_date) { where += ' AND ce.created_at >= ?'; values.push(filters.start_date); }
        if (filters.end_date) { where += ' AND ce.created_at <= ?'; values.push(filters.end_date); }
        const [rows] = await pool.query(`
            SELECT ce.engagement_type, COUNT(DISTINCT ce.session_uuid) AS count,
                AVG(ce.reading_time_seconds) AS avg_reading_time,
                AVG(ce.scroll_depth) AS avg_scroll_depth,
                AVG(ce.max_scroll_depth) AS avg_max_scroll_depth,
                COUNT(DISTINCT CASE WHEN ce.reading_completed = TRUE THEN ce.session_uuid END) AS completed_count
            FROM content_engagement ce ${where}
              AND EXISTS (SELECT 1 FROM page_views pv WHERE pv.content_id = ce.content_id AND pv.session_uuid = ce.session_uuid)
            GROUP BY ce.engagement_type`, values);
        return rows;
    }
}

module.exports = ContentAnalytics;
