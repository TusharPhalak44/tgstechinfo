const { pool } = require('../config/database');

class Role {
    static async create(roleData) {
        const { name, description, level = 0, is_system = false } = roleData;
        const query = `
            INSERT INTO roles (name, description, level, is_system)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [name, description, level, is_system]);
        return await Role.findById(result.insertId);
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM roles WHERE id = ?', [id]);
        return rows[0];
    }

    static async findByName(name) {
        const [rows] = await pool.query('SELECT * FROM roles WHERE name = ?', [name]);
        return rows[0];
    }

    static async findAll() {
        const [rows] = await pool.query('SELECT * FROM roles ORDER BY level DESC');
        return rows;
    }

    static async findByLevel(minLevel) {
        const [rows] = await pool.query('SELECT * FROM roles WHERE level >= ? ORDER BY level DESC', [minLevel]);
        return rows;
    }

    static async update(id, roleData) {
        const { name, description, level, is_system } = roleData;
        const query = `
            UPDATE roles 
            SET name = ?, description = ?, level = ?, is_system = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        await pool.query(query, [name, description, level, is_system, id]);
        return await Role.findById(id);
    }

    static async delete(id) {
        const role = await Role.findById(id);
        if (role && role.is_system) {
            throw new Error('Cannot delete system roles');
        }
        await pool.query('DELETE FROM roles WHERE id = ?', [id]);
    }

    static async assignPermission(roleId, permissionId) {
        const query = `
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE role_id = role_id
        `;
        await pool.query(query, [roleId, permissionId]);
    }

    static async removePermission(roleId, permissionId) {
        await pool.query(
            'DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?',
            [roleId, permissionId]
        );
    }

    static async setPermissions(roleId, permissionIds) {
        await pool.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
        
        if (permissionIds.length > 0) {
            const values = permissionIds.map(pid => `(${roleId}, ${pid})`).join(',');
            await pool.query(
                `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`
            );
        }
    }

    static async getPermissions(roleId) {
        const [rows] = await pool.query(
            `SELECT p.* FROM permissions p
             INNER JOIN role_permissions rp ON p.id = rp.permission_id
             WHERE rp.role_id = ?
             ORDER BY p.resource, p.action`,
            [roleId]
        );
        return rows;
    }

    static async getUsers(roleId) {
        const [rows] = await pool.query(
            `SELECT u.id, u.first_name, u.last_name, u.email, u.is_active
             FROM users u
             INNER JOIN user_roles ur ON u.id = ur.user_id
             WHERE ur.role_id = ?`,
            [roleId]
        );
        return rows;
    }

    static async assignToUser(userId, roleId) {
        const query = `
            INSERT INTO user_roles (user_id, role_id)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE role_id = role_id
        `;
        await pool.query(query, [userId, roleId]);
    }

    static async removeFromUser(userId, roleId) {
        await pool.query(
            'DELETE FROM user_roles WHERE user_id = ? AND role_id = ?',
            [userId, roleId]
        );
    }

    static async setUserRoles(userId, roleIds) {
        await pool.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
        
        if (roleIds.length > 0) {
            const values = roleIds.map(rid => `(${userId}, ${rid})`).join(',');
            await pool.query(
                `INSERT INTO user_roles (user_id, role_id) VALUES ${values}`
            );
        }
    }

    static async getUserRoles(userId) {
        const [rows] = await pool.query(
            `SELECT r.* FROM roles r
             INNER JOIN user_roles ur ON r.id = ur.role_id
             WHERE ur.user_id = ?
             ORDER BY r.level DESC`,
            [userId]
        );
        return rows;
    }

    static async getUserHighestRole(userId) {
        const [rows] = await pool.query(
            `SELECT r.* FROM roles r
             INNER JOIN user_roles ur ON r.id = ur.role_id
             WHERE ur.user_id = ?
             ORDER BY r.level DESC
             LIMIT 1`,
            [userId]
        );
        return rows[0];
    }
}

module.exports = Role;
