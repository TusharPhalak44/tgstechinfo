const { pool } = require('../config/database');

class ContactSubmission {
    static async create(data) {
        const {
            full_name,
            email,
            company,
            inquiry_category = 'general',
            subject,
            message,
            consent_given = false,
            ip_address,
            user_agent
        } = data;

        const query = `
            INSERT INTO contact_submissions 
            (full_name, email, company, inquiry_category, subject, message, consent_given, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.query(query, [
            full_name,
            email,
            company || null,
            inquiry_category,
            subject,
            message,
            consent_given,
            ip_address || null,
            user_agent || null
        ]);

        return { id: result.insertId, ...data };
    }

    static async findAll(filters = {}) {
        const { status, category, limit = 50, offset = 0 } = filters;
        
        let query = 'SELECT * FROM contact_submissions WHERE 1=1';
        const values = [];

        if (status) {
            query += ' AND status = ?';
            values.push(status);
        }

        if (category) {
            query += ' AND inquiry_category = ?';
            values.push(category);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        values.push(parseInt(limit), parseInt(offset));

        const [rows] = await pool.query(query, values);
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM contact_submissions WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async updateStatus(id, status) {
        const [result] = await pool.query(
            'UPDATE contact_submissions SET status = ? WHERE id = ?',
            [status, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM contact_submissions WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = ContactSubmission;
