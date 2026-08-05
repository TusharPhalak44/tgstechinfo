const { pool } = require('../config/database');

class AuditLog {
    static async create(logData) {
        const { user_id, action, entity_type, entity_id, ip_address, details, status = 'success' } = logData;
        
        const query = `
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, details, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [
            user_id,
            action,
            entity_type || null,
            entity_id || null,
            ip_address || null,
            details || null,
            status
        ]);
        
        return await AuditLog.findById(result.insertId);
    }

    static async findById(id) {
        const [rows] = await pool.query(
            'SELECT * FROM audit_logs WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async findAll(filters = {}) {
        const { user_id, action, entity_type, status, search, limit = 100, offset = 0 } = filters;
        
        let query = `
            SELECT al.*, u.email as user_email, u.first_name, u.last_name 
            FROM audit_logs al 
            LEFT JOIN users u ON al.user_id = u.id 
            WHERE 1=1
        `;
        const params = [];
        
        if (user_id) {
            query += ' AND al.user_id = ?';
            params.push(user_id);
        }
        
        if (action) {
            query += ' AND al.action = ?';
            params.push(action);
        }
        
        if (entity_type) {
            query += ' AND al.entity_type = ?';
            params.push(entity_type);
        }
        
        if (status) {
            query += ' AND al.status = ?';
            params.push(status);
        }
        
        if (search) {
            query += ' AND (al.action LIKE ? OR al.details LIKE ? OR u.email LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        
        const [rows] = await pool.query(query, params);
        return rows;
    }

    static async getCount(filters = {}) {
        const { user_id, action, entity_type, status, search } = filters;
        
        let query = 'SELECT COUNT(*) as count FROM audit_logs WHERE 1=1';
        const params = [];
        
        if (user_id) {
            query += ' AND user_id = ?';
            params.push(user_id);
        }
        
        if (action) {
            query += ' AND action = ?';
            params.push(action);
        }
        
        if (entity_type) {
            query += ' AND entity_type = ?';
            params.push(entity_type);
        }
        
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        
        if (search) {
            query += ' AND (action LIKE ? OR details LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }
        
        const [rows] = await pool.query(query, params);
        return rows[0].count;
    }

    static async delete(id) {
        const [result] = await pool.query(
            'DELETE FROM audit_logs WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async deleteOldLogs(daysToKeep = 90) {
        const query = `
            DELETE FROM audit_logs 
            WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
        `;
        const [result] = await pool.query(query, [daysToKeep]);
        return result.affectedRows;
    }
}

module.exports = AuditLog;
