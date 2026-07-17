const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class VisitorSession {
    static async create(sessionData) {
        const {
            consent_uuid,
            user_id,
            country,
            browser,
            operating_system,
            device_type,
            screen_resolution,
            language,
            timezone,
            ip_address,
            referrer,
            landing_page
        } = sessionData;

        const session_uuid = uuidv4();

        const query = `
            INSERT INTO visitor_sessions (
                session_uuid, consent_uuid, user_id, country, browser, operating_system,
                device_type, screen_resolution, language, timezone, ip_address, referrer, landing_page
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            session_uuid, consent_uuid, user_id, country, browser, operating_system,
            device_type, screen_resolution, language, timezone, ip_address, referrer, landing_page
        ];

        await pool.query(query, values);
        return await VisitorSession.findByUuid(session_uuid);
    }

    static async findByUuid(session_uuid) {
        const query = 'SELECT * FROM visitor_sessions WHERE session_uuid = ?';
        const [rows] = await pool.query(query, [session_uuid]);
        return rows[0];
    }

    static async findByConsentUuid(consent_uuid) {
        const query = 'SELECT * FROM visitor_sessions WHERE consent_uuid = ? ORDER BY session_start DESC LIMIT 1';
        const [rows] = await pool.query(query, [consent_uuid]);
        return rows[0];
    }

    static async update(session_uuid, updateData) {
        const allowedFields = [
            'session_end', 'total_session_duration', 'total_pages_visited',
            'exit_page'
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

        values.push(session_uuid);
        await pool.query(`UPDATE visitor_sessions SET ${updates.join(', ')} WHERE session_uuid = ?`, values);
        return await VisitorSession.findByUuid(session_uuid);
    }

    static async incrementPageCount(session_uuid) {
        console.log('Incrementing page count for session:', session_uuid);
        const [result] = await pool.query('UPDATE visitor_sessions SET total_pages_visited = total_pages_visited + 1 WHERE session_uuid = ?', [session_uuid]);
        console.log('Increment result:', result.affectedRows);
        return result;
    }

    static async getAnalytics(filters = {}) {
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

        const query = `
            SELECT 
                COUNT(*) as total_sessions,
                AVG(total_session_duration) as avg_session_duration,
                AVG(total_pages_visited) as avg_pages_per_session,
                COUNT(DISTINCT ip_address) as unique_visitors,
                SUM(CASE WHEN total_pages_visited = 1 THEN 1 ELSE 0 END) as bounce_count,
                device_type,
                country
            FROM visitor_sessions
            ${baseWhere}
            GROUP BY device_type, country
            ORDER BY total_sessions DESC
        `;

        const [rows] = await pool.query(query, values);
        return rows;
    }
}

module.exports = VisitorSession;
