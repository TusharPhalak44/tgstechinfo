const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class CookieConsent {
    static async create(consentData) {
        const {
            user_id = null,
            session_id = null,
            consent_type,
            necessary_cookies = true,
            functional_cookies = false,
            analytics_cookies = false,
            marketing_cookies = false,
            consent_version = 1,
            expires_at = null,
            ip_address = null,
            user_agent = null
        } = consentData;

        const uuid = uuidv4();
        
        // Set default expiry to 1 year if not provided
        const expiryDate = expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

        const query = `
            INSERT INTO cookie_consents 
            (uuid, user_id, session_id, consent_type, necessary_cookies, functional_cookies, 
             analytics_cookies, marketing_cookies, consent_version, expires_at, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.query(query, [
            uuid,
            user_id,
            session_id,
            consent_type,
            necessary_cookies,
            functional_cookies,
            analytics_cookies,
            marketing_cookies,
            consent_version,
            expiryDate,
            ip_address,
            user_agent
        ]);

        return await CookieConsent.findByUuid(uuid);
    }

    static async findByUuid(uuid) {
        const [rows] = await pool.query('SELECT * FROM cookie_consents WHERE uuid = ?', [uuid]);
        return rows[0] || null;
    }

    static async findByUserId(user_id) {
        const [rows] = await pool.query(
            'SELECT * FROM cookie_consents WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [user_id]
        );
        return rows[0] || null;
    }

    static async findBySessionId(session_id) {
        const [rows] = await pool.query(
            'SELECT * FROM cookie_consents WHERE session_id = ? AND (user_id IS NULL OR user_id = 0) ORDER BY created_at DESC LIMIT 1',
            [session_id]
        );
        return rows[0] || null;
    }

    static async findAll(filters = {}) {
        let query = 'SELECT * FROM cookie_consents WHERE 1=1';
        const values = [];

        if (filters.user_id) {
            query += ' AND user_id = ?';
            values.push(filters.user_id);
        }

        if (filters.session_id) {
            query += ' AND session_id = ?';
            values.push(filters.session_id);
        }

        if (filters.consent_type) {
            query += ' AND consent_type = ?';
            values.push(filters.consent_type);
        }

        if (filters.active_only) {
            query += ' AND (expires_at IS NULL OR expires_at > NOW())';
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

    static async update(uuid, consentData) {
        const {
            consent_type,
            necessary_cookies,
            functional_cookies,
            analytics_cookies,
            marketing_cookies,
            consent_version,
            expires_at,
            ip_address,
            user_agent
        } = consentData;

        const updates = [];
        const values = [];

        if (consent_type !== undefined) {
            updates.push('consent_type = ?');
            values.push(consent_type);
        }

        if (necessary_cookies !== undefined) {
            updates.push('necessary_cookies = ?');
            values.push(necessary_cookies);
        }

        if (functional_cookies !== undefined) {
            updates.push('functional_cookies = ?');
            values.push(functional_cookies);
        }

        if (analytics_cookies !== undefined) {
            updates.push('analytics_cookies = ?');
            values.push(analytics_cookies);
        }

        if (marketing_cookies !== undefined) {
            updates.push('marketing_cookies = ?');
            values.push(marketing_cookies);
        }

        if (consent_version !== undefined) {
            updates.push('consent_version = ?');
            values.push(consent_version);
        }

        if (expires_at !== undefined) {
            updates.push('expires_at = ?');
            values.push(expires_at);
        }

        if (ip_address !== undefined) {
            updates.push('ip_address = ?');
            values.push(ip_address);
        }

        if (user_agent !== undefined) {
            updates.push('user_agent = ?');
            values.push(user_agent);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(uuid);

        await pool.query(`UPDATE cookie_consents SET ${updates.join(', ')} WHERE uuid = ?`, values);
        return await CookieConsent.findByUuid(uuid);
    }

    static async delete(uuid) {
        const [result] = await pool.query('DELETE FROM cookie_consents WHERE uuid = ?', [uuid]);
        return result.affectedRows > 0;
    }

    static async markAsWithdrawn(uuid) {
        await pool.query(
            'UPDATE cookie_consents SET expires_at = NOW(), updated_at = CURRENT_TIMESTAMP WHERE uuid = ?',
            [uuid]
        );
        return await CookieConsent.findByUuid(uuid);
    }

    static async getCurrentConsent(user_id = null, session_id = null) {
        if (user_id) {
            const consent = await CookieConsent.findByUserId(user_id);
            if (consent && (!consent.expires_at || new Date(consent.expires_at) > new Date())) {
                return consent;
            }
        }

        if (session_id) {
            const consent = await CookieConsent.findBySessionId(session_id);
            if (consent && (!consent.expires_at || new Date(consent.expires_at) > new Date())) {
                return consent;
            }
        }

        return null;
    }
}

module.exports = CookieConsent;
