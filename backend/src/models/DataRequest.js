const { pool } = require('../config/database');

class DataRequest {
    static async create(data) {
        const {
            request_type, first_name, last_name, email, alt_email, phone,
            company, job_title, country, state,
            dsar_type, dns_type, details, ip_address, user_agent
        } = data;

        const [result] = await pool.query(
            `INSERT INTO data_requests
             (request_type, first_name, last_name, email, alt_email, phone,
              company, job_title, country, state, dsar_type, dns_type, details, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                request_type, first_name, last_name, email, alt_email || null, phone || null,
                company || null, job_title || null, country || null, state || null,
                dsar_type || null, dns_type || null, details || null,
                ip_address || null, user_agent || null
            ]
        );
        const [rows] = await pool.query('SELECT * FROM data_requests WHERE id = ?', [result.insertId]);
        return rows[0];
    }

    static async findAll({ status, request_type, limit = 50, offset = 0 } = {}) {
        let where = 'WHERE 1=1';
        const values = [];
        if (status) { where += ' AND status = ?'; values.push(status); }
        if (request_type) { where += ' AND request_type = ?'; values.push(request_type); }

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM data_requests ${where}`, values
        );
        const [rows] = await pool.query(
            `SELECT * FROM data_requests ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...values, parseInt(limit), parseInt(offset)]
        );
        return { rows, total };
    }

    static async updateStatus(id, status, admin_notes) {
        await pool.query(
            `UPDATE data_requests SET status = ?, admin_notes = ? WHERE id = ?`,
            [status, admin_notes || null, id]
        );
        const [rows] = await pool.query('SELECT * FROM data_requests WHERE id = ?', [id]);
        return rows[0];
    }
}

module.exports = DataRequest;
