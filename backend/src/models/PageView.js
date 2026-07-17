const { pool } = require('../config/database');

class PageView {
    static async create(pageViewData) {
        const {
            session_uuid,
            consent_uuid,
            page_url,
            page_title,
            page_type,
            content_type,
            content_id
        } = pageViewData;

        const query = `
            INSERT INTO page_views (
                session_uuid, consent_uuid, page_url, page_title, page_type,
                content_type, content_id, entered_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;

        const values = [
            session_uuid, consent_uuid, page_url, page_title, page_type,
            content_type, content_id
        ];

        const [result] = await pool.query(query, values);
        return await PageView.findById(result.insertId);
    }

    static async findById(id) {
        const query = 'SELECT * FROM page_views WHERE id = ?';
        const [rows] = await pool.query(query, [id]);
        return rows[0];
    }

    static async update(id, updateData) {
        const allowedFields = [
            'exited_at', 'time_spent_seconds', 'scroll_percentage', 'is_bounce'
        ];

        const updates = [];
        const values = [];

        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(updateData[field]);
            }
        }

        if (updates.length === 0) return null;

        values.push(id);
        await pool.query(`UPDATE page_views SET ${updates.join(', ')} WHERE id = ?`, values);
        return await PageView.findById(id);
    }

    static async findBySession(session_uuid) {
        const query = 'SELECT * FROM page_views WHERE session_uuid = ? ORDER BY entered_at ASC';
        const [rows] = await pool.query(query, [session_uuid]);
        return rows;
    }

    static async getContentAnalytics(contentId, filters = {}) {
        let baseWhere = ' WHERE content_id = ?';
        const values = [contentId];

        if (filters.start_date) {
            baseWhere += ' AND entered_at >= ?';
            values.push(filters.start_date);
        }
        if (filters.end_date) {
            baseWhere += ' AND entered_at <= ?';
            values.push(filters.end_date);
        }

        const query = `
            SELECT 
                COUNT(*) as total_views,
                COUNT(DISTINCT session_uuid) as unique_views,
                AVG(time_spent_seconds) as avg_time_spent,
                AVG(scroll_percentage) as avg_scroll_depth,
                SUM(CASE WHEN is_bounce = TRUE THEN 1 ELSE 0 END) as bounce_count
            FROM page_views
            ${baseWhere}
        `;

        const [rows] = await pool.query(query, values);
        return rows[0];
    }

    static async getPopularPages(limit = 10, filters = {}) {
        let baseWhere = ' WHERE 1=1';
        const values = [];

        if (filters.start_date) {
            baseWhere += ' AND entered_at >= ?';
            values.push(filters.start_date);
        }
        if (filters.end_date) {
            baseWhere += ' AND entered_at <= ?';
            values.push(filters.end_date);
        }

        const query = `
            SELECT 
                page_url,
                page_title,
                page_type,
                COUNT(*) as view_count,
                COUNT(DISTINCT session_uuid) as unique_views,
                AVG(time_spent_seconds) as avg_time_spent
            FROM page_views
            ${baseWhere}
            GROUP BY page_url, page_title, page_type
            ORDER BY view_count DESC
            LIMIT ?
        `;

        values.push(limit);
        const [rows] = await pool.query(query, values);
        return rows;
    }
}

module.exports = PageView;
