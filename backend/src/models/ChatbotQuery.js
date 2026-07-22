const { pool } = require('../config/database');

class ChatbotQuery {
    static async create(queryData) {
        const { email, query } = queryData;

        const sql = `
            INSERT INTO chatbot_queries (email, query, status)
            VALUES (?, ?, 'pending')
        `;

        const [result] = await pool.query(sql, [email, query]);
        return await this.findById(result.insertId);
    }

    static async findById(id) {
        const sql = 'SELECT * FROM chatbot_queries WHERE id = ?';
        const [rows] = await pool.query(sql, [id]);
        return rows[0];
    }

    static async findAll(filters = {}) {
        let sql = 'SELECT * FROM chatbot_queries WHERE 1=1';
        const params = [];

        if (filters.status) {
            sql += ' AND status = ?';
            params.push(filters.status);
        }

        sql += ' ORDER BY created_at DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            params.push(filters.limit);
        }

        const [rows] = await pool.query(sql, params);
        return rows;
    }

    static async updateStatus(id, status, adminResponse = null) {
        const sql = `
            UPDATE chatbot_queries 
            SET status = ?, admin_response = ?, updated_at = NOW()
            WHERE id = ?
        `;

        const [result] = await pool.query(sql, [status, adminResponse, id]);
        return result.affectedRows > 0;
    }

    static async getStats() {
        const sql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'answered' THEN 1 ELSE 0 END) as answered,
                SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
            FROM chatbot_queries
        `;

        const [rows] = await pool.query(sql);
        return rows[0];
    }
}

module.exports = ChatbotQuery;
