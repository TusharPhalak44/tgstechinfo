const { pool } = require('../config/database');

class User {
    static async create(userData) {
        const { first_name, last_name, email, password_hash, role = 'user' } = userData;
        const query = `
            INSERT INTO users (first_name, last_name, email, password_hash, role)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [first_name, last_name, email, password_hash, role]);
        return await User.findById(result.insertId);
    }

    static async findByEmail(email) {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await pool.query(
            'SELECT id, first_name, last_name, email, role, is_active, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async update(id, userData) {
        const { first_name, last_name, email, is_active } = userData;
        const query = `
            UPDATE users 
            SET first_name = ?, last_name = ?, email = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        await pool.query(query, [first_name, last_name, email, is_active, id]);
        return await User.findById(id);
    }

    // Account lockout methods
    static async incrementFailedLogin(email) {
        const query = `
            UPDATE users 
            SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1,
                last_failed_login = CURRENT_TIMESTAMP
            WHERE email = ?
        `;
        await pool.query(query, [email]);
    }

    static async resetFailedLogin(email) {
        const query = `
            UPDATE users 
            SET failed_login_attempts = 0,
                last_failed_login = NULL,
                locked_until = NULL
            WHERE email = ?
        `;
        await pool.query(query, [email]);
    }

    static async isAccountLocked(email) {
        const [rows] = await pool.query(
            'SELECT locked_until FROM users WHERE email = ?',
            [email]
        );
        if (!rows[0]) return false;
        
        const user = rows[0];
        if (!user.locked_until) return false;
        
        // Check if lockout has expired
        if (new Date(user.locked_until) < new Date()) {
            await User.resetFailedLogin(email);
            return false;
        }
        
        return true;
    }

    static async lockAccount(email, lockoutMinutes = 15) {
        const lockedUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
        const query = `
            UPDATE users 
            SET locked_until = ?
            WHERE email = ?
        `;
        await pool.query(query, [lockedUntil, email]);
    }

    static async getFailedLoginAttempts(email) {
        const [rows] = await pool.query(
            'SELECT failed_login_attempts, last_failed_login FROM users WHERE email = ?',
            [email]
        );
        return rows[0] ? { attempts: rows[0].failed_login_attempts || 0, lastFailed: rows[0].last_failed_login } : null;
    }
}

module.exports = User;
