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

    static async getConversionFunnel() {
        const query = `
            SELECT 
                action_type,
                COUNT(*) as count,
                COUNT(DISTINCT session_uuid) as unique_sessions,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
            FROM user_journey
            GROUP BY action_type
            ORDER BY count DESC
        `;

        const [rows] = await pool.query(query);
        return rows;
    }
}

module.exports = UserJourney;
