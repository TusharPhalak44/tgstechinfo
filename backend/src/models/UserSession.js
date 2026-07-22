const { pool } = require('../config/database');

class UserSession {
    static async create(sessionData) {
        const {
            user_id,
            session_token,
            refresh_token,
            device_name,
            device_type,
            browser,
            os,
            ip_address,
            user_agent,
            expires_at
        } = sessionData;

        const query = `
            INSERT INTO user_sessions 
            (user_id, session_token, refresh_token, device_name, device_type, browser, os, ip_address, user_agent, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [
            user_id,
            session_token,
            refresh_token,
            device_name,
            device_type,
            browser,
            os,
            ip_address,
            user_agent,
            expires_at
        ]);
        return await UserSession.findById(result.insertId);
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM user_sessions WHERE id = ?', [id]);
        return rows[0];
    }

    static async findBySessionToken(session_token) {
        const [rows] = await pool.query('SELECT * FROM user_sessions WHERE session_token = ?', [session_token]);
        return rows[0];
    }

    static async findByRefreshToken(refresh_token) {
        const [rows] = await pool.query('SELECT * FROM user_sessions WHERE refresh_token = ?', [refresh_token]);
        return rows[0];
    }

    static async findByUserId(user_id) {
        const [rows] = await pool.query(
            'SELECT * FROM user_sessions WHERE user_id = ? AND is_active = TRUE ORDER BY last_activity DESC',
            [user_id]
        );
        return rows;
    }

    static async countActiveSessions(user_id) {
        const [rows] = await pool.query(
            'SELECT COUNT(*) as count FROM user_sessions WHERE user_id = ? AND is_active = TRUE AND expires_at > NOW()',
            [user_id]
        );
        return rows[0].count;
    }

    static async updateLastActivity(session_token) {
        const query = `
            UPDATE user_sessions 
            SET last_activity = CURRENT_TIMESTAMP 
            WHERE session_token = ?
        `;
        await pool.query(query, [session_token]);
    }

    static async deactivate(session_token) {
        const query = `
            UPDATE user_sessions 
            SET is_active = FALSE 
            WHERE session_token = ?
        `;
        await pool.query(query, [session_token]);
    }

    static async deactivateAllForUser(user_id, except_session_id = null) {
        let query = 'UPDATE user_sessions SET is_active = FALSE WHERE user_id = ?';
        const params = [user_id];
        
        if (except_session_id) {
            query += ' AND id != ?';
            params.push(except_session_id);
        }
        
        await pool.query(query, params);
    }

    static async deleteExpired() {
        const query = 'DELETE FROM user_sessions WHERE expires_at < NOW() OR (is_active = FALSE AND last_activity < DATE_SUB(NOW(), INTERVAL 30 DAY))';
        await pool.query(query);
    }

    static async deleteById(id) {
        await pool.query('DELETE FROM user_sessions WHERE id = ?', [id]);
    }
}

module.exports = UserSession;
