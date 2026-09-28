const { pool } = require('../config/database');

class UserJourney {
    static async create(journeyData) {
        const {
            session_uuid,
            consent_uuid,
            step_number,
            page_url,
            page_title,
            content_type,
            content_id,
            action_type,
            action_data
        } = journeyData;

        const query = `
            INSERT INTO user_journey (
                session_uuid, consent_uuid, step_number, page_url, page_title,
                content_type, content_id, action_type, action_data, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;

        const values = [
            session_uuid, consent_uuid, step_number, page_url, page_title,
            content_type, content_id, action_type,
            action_data ? JSON.stringify(action_data) : null
        ];

        await pool.query(query, values);
        return await UserJourney.findBySessionAndStep(session_uuid, step_number);
    }

    static async findById(id) {
        const query = 'SELECT * FROM user_journey WHERE id = ?';
        const [rows] = await pool.query(query, [id]);
        return rows[0];
    }

    static async findBySession(session_uuid) {
        const query = 'SELECT * FROM user_journey WHERE session_uuid = ? ORDER BY step_number ASC';
        const [rows] = await pool.query(query, [session_uuid]);
        return rows;
    }

    static async findBySessionAndStep(session_uuid, step_number) {
        const query = 'SELECT * FROM user_journey WHERE session_uuid = ? AND step_number = ?';
        const [rows] = await pool.query(query, [session_uuid, step_number]);
        return rows[0];
    }

    static async getNextStepNumber(session_uuid) {
        const query = `
            SELECT COALESCE(MAX(step_number), 0) + 1 as next_step
            FROM user_journey
            WHERE session_uuid = ?
        `;
        const [rows] = await pool.query(query, [session_uuid]);
        return rows[0].next_step;
    }

    static async getPopularJourneys(limit = 10) {
        const query = `
            SELECT 
                session_uuid,
                COUNT(*) as steps,
                GROUP_CONCAT(page_url ORDER BY step_number SEPARATOR ' -> ') as journey_path
            FROM user_journey
            GROUP BY session_uuid
            HAVING steps >= 3
            ORDER BY steps DESC
            LIMIT ?
        `;

        const [rows] = await pool.query(query, [limit]);
        return rows;
    }

    static async getConversionFunnel(filters = {}) {
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

        // Build a proper conversion funnel from real user journey data
        const query = `
            SELECT 
                CASE 
                    WHEN action_type = 'page_view' THEN 'Page Views'
                    WHEN action_type = 'content_view' THEN 'Content Engagement'
                    WHEN action_type = 'cta_click' THEN 'CTA Interactions'
                    WHEN action_type = 'form_submit' THEN 'Form Submissions'
                    WHEN action_type = 'download' THEN 'Downloads'
                    WHEN action_type = 'search' THEN 'Search Actions'
                    ELSE 'Other Actions'
                END as step,
                action_type,
                COUNT(*) as count,
                COUNT(*) as sessions,
                COUNT(DISTINCT session_uuid) as unique_sessions,
                ROUND(COUNT(DISTINCT session_uuid) * 100.0 / NULLIF(t.total_sessions, 0), 2) as percentage,
                ROUND(COUNT(DISTINCT session_uuid) * 100.0 / NULLIF(t.total_sessions, 0), 2) as pct
            FROM user_journey
            CROSS JOIN (SELECT COUNT(DISTINCT session_uuid) as total_sessions FROM user_journey ${baseWhere}) as t
            ${baseWhere}
            GROUP BY action_type, t.total_sessions
            ORDER BY 
                CASE action_type
                    WHEN 'page_view' THEN 1
                    WHEN 'content_view' THEN 2
                    WHEN 'cta_click' THEN 3
                    WHEN 'form_submit' THEN 4
                    WHEN 'download' THEN 5
                    WHEN 'search' THEN 6
                    ELSE 7
                END
        `;

        const [rows] = await pool.query(query, [...values, ...values]);
        return rows;
    }
}

module.exports = UserJourney;
