const { pool } = require('../config/database');

class ContentEngagement {
    static async create(engagementData) {
        const {
            session_uuid,
            consent_uuid,
            content_id,
            engagement_type,
            engagement_data,
            reading_time_seconds,
            scroll_depth,
            max_scroll_depth,
            exit_position,
            reading_completed
        } = engagementData;

        const query = `
            INSERT INTO content_engagement (
                session_uuid, consent_uuid, content_id, engagement_type, engagement_data,
                reading_time_seconds, scroll_depth, max_scroll_depth, exit_position, reading_completed
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            session_uuid, consent_uuid, content_id, engagement_type,
            engagement_data ? JSON.stringify(engagement_data) : null,
            reading_time_seconds || 0, scroll_depth || 0, max_scroll_depth || 0,
            exit_position || 0, reading_completed || false
        ];

        const [result] = await pool.query(query, values);
        return await ContentEngagement.findById(result.insertId);
    }

    static async findById(id) {
        const query = 'SELECT * FROM content_engagement WHERE id = ?';
        const [rows] = await pool.query(query, [id]);
        return rows[0];
    }

    static async findByContent(contentId) {
        const query = 'SELECT * FROM content_engagement WHERE content_id = ? ORDER BY created_at DESC';
        const [rows] = await pool.query(query, [contentId]);
        return rows;
    }

    static async getContentStats(contentId) {
        const query = `
            SELECT 
                engagement_type,
                COUNT(*) as count,
                AVG(reading_time_seconds) as avg_reading_time,
                AVG(scroll_depth) as avg_scroll_depth,
                SUM(CASE WHEN reading_completed = TRUE THEN 1 ELSE 0 END) as completed_count
            FROM content_engagement
            WHERE content_id = ?
            GROUP BY engagement_type
        `;

        const [rows] = await pool.query(query, [contentId]);
        return rows;
    }

    static async getEngagementByType(engagementType, filters = {}) {
        let baseWhere = ' WHERE engagement_type = ?';
        const values = [engagementType];

        if (filters.start_date) {
            baseWhere += ' AND created_at >= ?';
            values.push(filters.start_date);
        }
        if (filters.end_date) {
            baseWhere += ' AND created_at <= ?';
            values.push(filters.end_date);
        }

        const query = `
            SELECT 
                ce.*,
                c.title as content_title,
                c.slug as content_slug
            FROM content_engagement ce
            LEFT JOIN contents c ON ce.content_id = c.id
            ${baseWhere}
            ORDER BY ce.created_at DESC
        `;

        const [rows] = await pool.query(query, values);
        return rows;
    }
}

module.exports = ContentEngagement;
