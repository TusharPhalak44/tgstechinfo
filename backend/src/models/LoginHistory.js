const { pool } = require('../config/database');

class LoginHistory {
    static async create(historyData) {
        const {
            user_id,
            session_id,
            device_name,
            device_type,
            browser,
            os,
            ip_address,
            user_agent,
            login_status,
            failure_reason
        } = historyData;

        const query = `
            INSERT INTO login_history 
            (user_id, session_id, device_name, device_type, browser, os, ip_address, user_agent, login_status, failure_reason)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [
            user_id,
            session_id,
            device_name,
            device_type,
            browser,
            os,
            ip_address,
            user_agent,
            login_status,
            failure_reason
        ]);
        return await LoginHistory.findById(result.insertId);
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM login_history WHERE id = ?', [id]);
        return rows[0];
    }

    static async findByUserId(user_id, limit = 20) {
        const [rows] = await pool.query(
            'SELECT * FROM login_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
            [user_id, limit]
        );
        return rows;
    }

    static async getRecentLogins(user_id, days = 30) {
        const [rows] = await pool.query(
            `SELECT * FROM login_history 
             WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
             ORDER BY created_at DESC`,
            [user_id, days]
        );
        return rows;
    }

    static async getFailedAttempts(user_id, minutes = 15) {
        const [rows] = await pool.query(
            `SELECT COUNT(*) as count FROM login_history 
             WHERE user_id = ? AND login_status = 'failed' 
             AND created_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
            [user_id, minutes]
        );
        return rows[0].count;
    }

    static async getFailedAttemptsByEmail(email, minutes = 15) {
        const [rows] = await pool.query(
            `SELECT COUNT(*) as count FROM login_history lh
             JOIN users u ON lh.user_id = u.id
             WHERE u.email = ? AND lh.login_status = 'failed' 
             AND lh.created_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
            [email, minutes]
        );
        return rows[0].count;
    }

    static async deleteOldHistory(days = 90) {
        const query = 'DELETE FROM login_history WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)';
        await pool.query(query, [days]);
    }
}

module.exports = LoginHistory;
