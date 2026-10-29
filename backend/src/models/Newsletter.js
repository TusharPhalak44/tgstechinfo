const { pool } = require('../config/database');
const crypto = require('crypto');

class Newsletter {
    static async subscribe(email, token = null, name = null) {
        const normalizedEmail = email.trim().toLowerCase();
        const unsubscribeToken = token || crypto.randomBytes(32).toString('hex');
        const cleanName = (typeof name === 'string' && name.trim()) ? name.trim() : null;
        await pool.query(
            `INSERT INTO newsletter_subscribers (email, name, unsubscribe_token, is_active)
             VALUES (?, ?, ?, 1)
             ON DUPLICATE KEY UPDATE is_active = 1, unsubscribed_at = NULL, unsubscribe_reason = NULL, name = COALESCE(VALUES(name), name), unsubscribe_token = VALUES(unsubscribe_token)`,
            [normalizedEmail, cleanName, unsubscribeToken]
        );
        return await this.findByEmail(normalizedEmail);
    }

    static async unsubscribe(email, reason = null) {
        const normalizedEmail = email.trim().toLowerCase();
        const cleanReason = (typeof reason === 'string' && reason.trim()) ? reason.trim().slice(0, 1000) : null;
        const [result] = await pool.query(
            'UPDATE newsletter_subscribers SET is_active = 0, unsubscribed_at = NOW(), unsubscribe_reason = ? WHERE email = ?',
            [cleanReason, normalizedEmail]
        );
        if (result.affectedRows === 0) {
            return null;
        }
        return await this.findByEmail(normalizedEmail);
    }

    static async findAll(active = null) {
        let query = 'SELECT id, email, name, is_active, created_at, unsubscribe_token, unsubscribed_at, unsubscribe_reason FROM newsletter_subscribers';
        const values = [];
        
        if (active !== null && active !== undefined) {
            query += ' WHERE is_active = ?';
            values.push(active ? 1 : 0);
        }
        
        query += ' ORDER BY created_at DESC';
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