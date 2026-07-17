const { pool } = require('../config/database');

class CtaClick {
    static async create(ctaData) {
        const {
            session_uuid,
            consent_uuid,
            content_id,
            cta_type,
            cta_text,
            cta_location
        } = ctaData;

        const query = `
            INSERT INTO cta_clicks (
                session_uuid, consent_uuid, content_id, cta_type,
                cta_text, cta_location, clicked_at
            ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;

        const values = [
            session_uuid, consent_uuid, content_id, cta_type,
            cta_text, cta_location
        ];

        const [result] = await pool.query(query, values);
        return await CtaClick.findById(result.insertId);
    }

    static async findById(id) {
        const query = 'SELECT * FROM cta_clicks WHERE id = ?';
        const [rows] = await pool.query(query, [id]);
        return rows[0];
    }

    static async findByContent(contentId) {
        const query = 'SELECT * FROM cta_clicks WHERE content_id = ? ORDER BY clicked_at DESC';
        const [rows] = await pool.query(query, [contentId]);
        return rows;
    }

    static async getCtaStats(contentId) {
        const query = `
            SELECT 
                cta_type,
                COUNT(*) as click_count,
                COUNT(DISTINCT session_uuid) as unique_clicks
            FROM cta_clicks
            WHERE content_id = ?
            GROUP BY cta_type
        `;

        const [rows] = await pool.query(query, [contentId]);
        return rows;
    }

    static async getCtaAnalytics(filters = {}) {
        let baseWhere = ' WHERE 1=1';
        const values = [];

        if (filters.start_date) {
            baseWhere += ' AND clicked_at >= ?';
            values.push(filters.start_date);
        }
        if (filters.end_date) {
            baseWhere += ' AND clicked_at <= ?';
            values.push(filters.end_date);
        }

        const query = `
            SELECT 
                cta_type,
                COUNT(*) as total_clicks,
                COUNT(DISTINCT session_uuid) as unique_clicks,
                COUNT(DISTINCT content_id) as content_count
            FROM cta_clicks
            ${baseWhere}
            GROUP BY cta_type
            ORDER BY total_clicks DESC
        `;

        const [rows] = await pool.query(query, values);
        return rows;
    }
}

module.exports = CtaClick;
