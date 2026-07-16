const { pool } = require('../config/database');

class CookieConsentLog {
    static async create(logData) {
        const {
            consent_uuid,
            action,
            previous_consent = null,
            new_consent,
            ip_address = null,
            user_agent = null
        } = logData;

        const query = `
            INSERT INTO cookie_consent_logs 
            (consent_uuid, action, previous_consent, new_consent, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.query(query, [
            consent_uuid,
            action,
            previous_consent ? JSON.stringify(previous_consent) : null,
            JSON.stringify(new_consent),
            ip_address,
            user_agent
        ]);

        return { id: result.insertId, ...logData };
    }

    static async findByConsentUuid(consent_uuid, filters = {}) {
        let query = 'SELECT * FROM cookie_consent_logs WHERE consent_uuid = ?';
        const values = [consent_uuid];

        if (filters.action) {
            query += ' AND action = ?';
            values.push(filters.action);
        }

        query += ' ORDER BY created_at DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            values.push(parseInt(filters.limit));
        }

        const [rows] = await pool.query(query, values);
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM cookie_consent_logs WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async findAll(filters = {}) {
        let query = 'SELECT * FROM cookie_consent_logs WHERE 1=1';
        const values = [];

        if (filters.consent_uuid) {
            query += ' AND consent_uuid = ?';
            values.push(filters.consent_uuid);
        }

        if (filters.action) {
            query += ' AND action = ?';
            values.push(filters.action);
        }

        if (filters.start_date) {
            query += ' AND created_at >= ?';
            values.push(filters.start_date);
        }

        if (filters.end_date) {
            query += ' AND created_at <= ?';
            values.push(filters.end_date);
        }

        query += ' ORDER BY created_at DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            values.push(parseInt(filters.limit));
        }

        if (filters.offset) {
            query += ' OFFSET ?';
            values.push(parseInt(filters.offset));
        }

        const [rows] = await pool.query(query, values);
        return rows;
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM cookie_consent_logs WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async deleteByConsentUuid(consent_uuid) {
        const [result] = await pool.query('DELETE FROM cookie_consent_logs WHERE consent_uuid = ?', [consent_uuid]);
        return result.affectedRows > 0;
    }
}

module.exports = CookieConsentLog;
