const { pool } = require('../config/database');
const { getNowInIST } = require('../utils/dateHelper');
const crypto = require('crypto');

class Newsletter {
    static async subscribe(email, token = null, name = null) {
        const normalizedEmail = email.trim().toLowerCase();
        const unsubscribeToken = token || crypto.randomBytes(32).toString('hex');
        const cleanName = (typeof name === 'string' && name.trim()) ? name.trim() : null;
        const currentIstTime = getNowInIST();
        await pool.query(
            `INSERT INTO newsletter_subscribers (email, name, unsubscribe_token, is_active, created_at)
             VALUES (?, ?, ?, 1, ?)
             ON DUPLICATE KEY UPDATE is_active = 1, unsubscribed_at = NULL, unsubscribe_reason = NULL, name = COALESCE(VALUES(name), name), unsubscribe_token = VALUES(unsubscribe_token)`,
            [normalizedEmail, cleanName, unsubscribeToken, currentIstTime]
        );
        return await this.findByEmail(normalizedEmail);
    }

    static async unsubscribe(email, reason = null) {
        const normalizedEmail = email.trim().toLowerCase();
        const cleanReason = (typeof reason === 'string' && reason.trim()) ? reason.trim().slice(0, 1000) : null;
        const currentIstTime = getNowInIST();
        const [result] = await pool.query(
            'UPDATE newsletter_subscribers SET is_active = 0, unsubscribed_at = ?, unsubscribe_reason = ? WHERE email = ?',
            [currentIstTime, cleanReason, normalizedEmail]
        );
        if (result.affectedRows === 0) {
            return null;
        }
        return await this.findByEmail(normalizedEmail);
    }

    static async findAll(active = null) {
        let query = `
            SELECT 
                ns.id, 
                ns.email, 
                ns.name, 
                ns.is_active, 
                ns.last_active_source,
                ns.preferences_instant_alerts,
                ns.preferences_weekly_digest,
                ns.preferences_general_alerts,
                ns.preferences_technology_alerts,
                ns.preferences_industry_alerts,
                ns.created_at, 
                ns.unsubscribe_token, 
                ns.unsubscribed_at, 
                ns.unsubscribe_reason,
                (SELECT GROUP_CONCAT(DISTINCT CONCAT(nsi.interest_type, ':', nsi.interest_value) SEPARATOR ', ')
                 FROM newsletter_subscription_interests nsi 
                 WHERE nsi.subscriber_id = ns.id AND nsi.is_active = 1) AS active_interests
            FROM newsletter_subscribers ns
        `;
        const values = [];
        
        if (active !== null && active !== undefined) {
            query += ' WHERE ns.is_active = ?';
            values.push(active ? 1 : 0);
        }
        
        query += ' ORDER BY ns.created_at DESC';
        const [rows] = await pool.query(query, values);
        return rows;
    }

    static async findByEmail(email) {
        const normalizedEmail = email.trim().toLowerCase();
        const [rows] = await pool.query('SELECT * FROM newsletter_subscribers WHERE email = ?', [normalizedEmail]);
        return rows[0] || null;
    }

    static async delete(email) {
        const normalizedEmail = email.trim().toLowerCase();
        const [result] = await pool.query('DELETE FROM newsletter_subscribers WHERE email = ?', [normalizedEmail]);
        return result.affectedRows > 0;
    }
}

module.exports = Newsletter;
