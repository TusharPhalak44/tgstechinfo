const { pool } = require('../config/database');

class LandingPage {
    static async create(data) {
        const { first_name, last_name, email, contact_number, content_id, extra_fields } = data;
        const [result] = await pool.query(
            `INSERT INTO landing_page_submissions (first_name, last_name, email, contact_number, content_id, extra_fields)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [first_name, last_name, email, contact_number, content_id, extra_fields ? JSON.stringify(extra_fields) : null]
        );
        const [rows] = await pool.query('SELECT * FROM landing_page_submissions WHERE id = ?', [result.insertId]);
        return rows[0];
    }

    static async findByEmailAndContent(email, content_id) {
        const [rows] = await pool.query(
            'SELECT * FROM landing_page_submissions WHERE email = ? AND content_id = ?',
            [email, content_id]
        );
        return rows[0];
    }

    static async grantAccess(id) {
        await pool.query('UPDATE landing_page_submissions SET has_access = true WHERE id = ?', [id]);
        const [rows] = await pool.query('SELECT * FROM landing_page_submissions WHERE id = ?', [id]);
        return rows[0];
    }

    static async findByUserId(user_id, { limit = 50, offset = 0 } = {}) {
        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM landing_page_submissions s
             INNER JOIN contents c ON s.content_id = c.id WHERE c.user_id = ?`, [user_id]
        );
        const [rows] = await pool.query(
            `SELECT s.*, c.title as content_title, c.slug as content_slug, c.pdf_file
             FROM landing_page_submissions s
             INNER JOIN contents c ON s.content_id = c.id
             WHERE c.user_id = ?
             ORDER BY s.created_at DESC LIMIT ? OFFSET ?`,
            [user_id, parseInt(limit), parseInt(offset)]
        );
        return { rows, total };
    }

    static async findAll({ content_id, limit = 50, offset = 0 } = {}) {
        let where = 'WHERE 1=1';
        const values = [];
        if (content_id) { where += ' AND s.content_id = ?'; values.push(content_id); }

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM landing_page_submissions s ${where}`, values
        );

        const [rows] = await pool.query(
            `SELECT s.*, c.title as content_title, c.pdf_file
             FROM landing_page_submissions s
             LEFT JOIN contents c ON s.content_id = c.id
             ${where}
             ORDER BY s.created_at DESC
             LIMIT ? OFFSET ?`,
            [...values, parseInt(limit), parseInt(offset)]
        );
        return { rows, total };
    }
}

module.exports = LandingPage;
