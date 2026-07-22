const { pool } = require('../config/database');

class Permission {
    static async create(permissionData) {
        const { name, description, resource, action } = permissionData;
        const query = `
            INSERT INTO permissions (name, description, resource, action)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [name, description, resource, action]);
        return await Permission.findById(result.insertId);
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM permissions WHERE id = ?', [id]);
        return rows[0];
    }

    static async findByName(name) {
        const [rows] = await pool.query('SELECT * FROM permissions WHERE name = ?', [name]);
        return rows[0];
    }

    static async findAll() {
        const [rows] = await pool.query('SELECT * FROM permissions ORDER BY resource, action');
        return rows;
    }

    static async findByResource(resource) {
        const [rows] = await pool.query('SELECT * FROM permissions WHERE resource = ?', [resource]);
        return rows;
    }

    static async update(id, permissionData) {
        const { name, description, resource, action } = permissionData;
        const query = `
            UPDATE permissions 
            SET name = ?, description = ?, resource = ?, action = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        await pool.query(query, [name, description, resource, action, id]);
        return await Permission.findById(id);
    }

    static async delete(id) {
        await pool.query('DELETE FROM permissions WHERE id = ?', [id]);
    }

    static async getPermissionsByRole(roleId) {
        const [rows] = await pool.query(
            `SELECT p.* FROM permissions p
             INNER JOIN role_permissions rp ON p.id = rp.permission_id
             WHERE rp.role_id = ?
             ORDER BY p.resource, p.action`,
            [roleId]
        );
        return rows;
    }

    static async getPermissionsByUser(userId) {
        const [rows] = await pool.query(
            `SELECT DISTINCT p.* FROM permissions p
             INNER JOIN role_permissions rp ON p.id = rp.permission_id
             INNER JOIN user_roles ur ON rp.role_id = ur.role_id
             WHERE ur.user_id = ?
             ORDER BY p.resource, p.action`,
            [userId]
        );
        return rows;
    }

    static async hasPermission(userId, permissionName) {
        const [rows] = await pool.query(
            `SELECT COUNT(*) as count FROM permissions p
             INNER JOIN role_permissions rp ON p.id = rp.permission_id
             INNER JOIN user_roles ur ON rp.role_id = ur.role_id
             WHERE ur.user_id = ? AND p.name = ?`,
            [userId, permissionName]
        );
        return rows[0].count > 0;
    }

    static async hasAnyPermission(userId, resource, action) {
        const [rows] = await pool.query(
            `SELECT COUNT(*) as count FROM permissions p
             INNER JOIN role_permissions rp ON p.id = rp.permission_id
             INNER JOIN user_roles ur ON rp.role_id = ur.role_id
             WHERE ur.user_id = ? AND p.resource = ? AND p.action = ?`,
            [userId, resource, action]
        );
        return rows[0].count > 0;
    }
}

module.exports = Permission;
