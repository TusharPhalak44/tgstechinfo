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
            baseWhere += ' AND timestamp >= ?';
            values.push(filters.start_date.includes(' ') ? filters.start_date : `${filters.start_date} 00:00:00`);
        }
        if (filters.end_date) {
            baseWhere += ' AND timestamp <= ?';
            values.push(filters.end_date.includes(' ') ? filters.end_date : `${filters.end_date} 23:59:59`);
        }

        // Ensure we have some data even if date filters exclude everything
        if (!filters.start_date && !filters.end_date) {
            // Default to last 90 days if no date range specified
            baseWhere += ' AND timestamp >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
        }

        // Get real CTA-like behavior from user journey data since actual CTA clicks are limited
        const query = `
            SELECT 
                CASE 
                    WHEN action_type = 'cta_click' THEN 'CTA Button Click'
                    WHEN action_type = 'form_submit' THEN 'Form Submission'
                    WHEN action_type = 'download' THEN 'File Download'
                    WHEN action_type = 'search' THEN 'Search Query'
                    WHEN page_url LIKE '%contact%' THEN 'Contact Page Visit'
                    WHEN page_url LIKE '%login%' THEN 'Login Page Visit'
                    WHEN page_url LIKE '%register%' THEN 'Registration Page Visit'
                    WHEN action_type = 'page_view' THEN 'Page Views'
                    ELSE 'Other Interaction'
                END as cta_type,
                COUNT(*) as click_count,
                COUNT(*) as clicks,
                COUNT(DISTINCT session_uuid) as unique_clicks,
                COUNT(DISTINCT content_id) as content_count,
                SUM(CASE WHEN action_type IN ('form_submit', 'download') THEN 1 ELSE 0 END) as conversions,
                ROUND(SUM(CASE WHEN action_type IN ('form_submit', 'download') THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as conv_rate,
                ROUND(SUM(CASE WHEN action_type IN ('form_submit', 'download') THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as conv
            FROM user_journey
            ${baseWhere}
            AND action_type IN ('cta_click', 'form_submit', 'download', 'page_view', 'search')
            GROUP BY cta_type
            ORDER BY 
                CASE 
                    WHEN cta_type = 'Form Submission' THEN 1
                    WHEN cta_type = 'File Download' THEN 2
                    WHEN cta_type = 'CTA Button Click' THEN 3
                    WHEN cta_type = 'Search Query' THEN 4
                    ELSE 5
                END,
                click_count DESC
        `;

        const [rows] = await pool.query(query, values);
        return rows;
    }
}

module.exports = CtaClick;
