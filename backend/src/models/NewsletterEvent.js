const { pool } = require('../config/database');

class NewsletterEvent {
    static async create(eventData) {
        const {
            session_uuid,
            consent_uuid,
            event_type,
            email,
            event_data
        } = eventData;

        const query = `
            INSERT INTO newsletter_events (
                session_uuid, consent_uuid, event_type, email, event_data
            ) VALUES (?, ?, ?, ?, ?)
        `;

        const values = [
            session_uuid, consent_uuid, event_type, email,
            event_data ? JSON.stringify(event_data) : null
        ];

        const [result] = await pool.query(query, values);
        return await NewsletterEvent.findById(result.insertId);
    }

    static async findById(id) {
        const query = 'SELECT * FROM newsletter_events WHERE id = ?';
        const [rows] = await pool.query(query, [id]);
        return rows[0];
    }

    static async findByEmail(email) {
        const query = 'SELECT * FROM newsletter_events WHERE email = ? ORDER BY created_at DESC';
        const [rows] = await pool.query(query, [email]);
        return rows;
    }

    static async getEventStats(filters = {}) {
        let baseWhere = ' WHERE 1=1';
        const values = [];

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
                event_type,
                COUNT(*) as event_count,
                COUNT(DISTINCT email) as unique_emails,
                COUNT(DISTINCT session_uuid) as unique_sessions
            FROM newsletter_events
            ${baseWhere}
            GROUP BY event_type
        `;

        const [rows] = await pool.query(query, values);
        return rows;
    }
}

module.exports = NewsletterEvent;
