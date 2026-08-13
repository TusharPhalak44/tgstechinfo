const { pool } = require('../config/database');
const Role = require('./Role');

class User {
    static async create(userData) {
        const { first_name, last_name, email, password_hash, role = 'user' } = userData;
        const query = `
            INSERT INTO users (first_name, last_name, email, password_hash, role)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [first_name, last_name, email, password_hash, role]);
        
        // Assign default role based on role string
        const user = await User.findById(result.insertId);
        if (user) {
            const roleName = role === 'admin' ? 'Admin' : role === 'user' ? 'Contributor' : 'Contributor';
            const defaultRole = await Role.findByName(roleName);
            if (defaultRole) {
                await Role.assignToUser(user.id, defaultRole.id);
            }
        }
        
        return user;
    }

    static async findByEmail(email) {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await pool.query(
            'SELECT id, first_name, last_name, email, role, is_active, avatar, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async update(id, userData) {
        const { first_name, last_name, email, is_active, avatar } = userData;
        
        // Build dynamic update query with only provided fields
        const updates = [];
        const values = [];
        
        if (first_name !== undefined) {
            updates.push('first_name = ?');
            values.push(first_name);
        }
        if (last_name !== undefined) {
            updates.push('last_name = ?');
            values.push(last_name);
        }
        if (email !== undefined) {
            updates.push('email = ?');
            values.push(email);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(is_active);
        }
        if (avatar !== undefined) {
            updates.push('avatar = ?');
            values.push(avatar);
        }
        
        if (updates.length === 0) {
            return await User.findById(id);
        }
        
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        
        const query = `
            UPDATE users 
            SET ${updates.join(', ')}
            WHERE id = ?
        `;
        await pool.query(query, values);
        return await User.findById(id);
    }

    static async getRoles(userId) {
        return await Role.getUserRoles(userId);
    }

    static async setResetToken(userId, hashedToken, expiry) {
        await pool.query(
            'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
            [hashedToken, expiry, userId]
        );
    }

    static async findByResetToken(hashedToken) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW() AND is_active = 1',
            [hashedToken]
        );
        return rows[0];
    }

    static async updatePassword(userId, hashedPassword) {
        await pool.query(
            'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
            [hashedPassword, userId]
        );
    }

    static async getPermissions(userId) {
        const Permission = require('./Permission');
        return await Permission.getPermissionsByUser(userId);
    }

    static async hasPermission(userId, permissionName) {
        const Permission = require('./Permission');
        return await Permission.hasPermission(userId, permissionName);
    }

    static async hasAnyPermission(userId, resource, action) {
        const Permission = require('./Permission');
        return await Permission.hasAnyPermission(userId, resource, action);
    }

    static async getHighestRole(userId) {
        return await Role.getUserHighestRole(userId);
    }

    static async getRoleLevel(userId) {
        const role = await Role.getUserHighestRole(userId);
        return role ? role.level : 0;
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
