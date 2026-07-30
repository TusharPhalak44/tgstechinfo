const { pool } = require('../config/database');

class EmailTemplate {
    static async create(data) {
        const { template_type, template_name, subject, html_body, is_active = true } = data;
        const [result] = await pool.query(
            `INSERT INTO email_templates (template_type, template_name, subject, html_body, is_active)
             VALUES (?, ?, ?, ?, ?)`,
            [template_type, template_name, subject, html_body, is_active]
        );
        return this.findById(result.insertId);
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM email_templates WHERE id = ?', [id]);
        return rows[0];
    }

    static async findByType(templateType) {
        const [rows] = await pool.query(
            'SELECT * FROM email_templates WHERE template_type = ? AND is_active = true ORDER BY created_at DESC LIMIT 1',
            [templateType]
        );
        return rows[0];
    }

    static async findAll(filters = {}) {
        let query = 'SELECT * FROM email_templates WHERE 1=1';
        const params = [];

        if (filters.template_type) {
            query += ' AND template_type = ?';
            params.push(filters.template_type);
        }

        if (filters.is_active !== undefined) {
            query += ' AND is_active = ?';
            params.push(filters.is_active);
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await pool.query(query, params);
        return rows;
    }

    static async update(id, data) {
        const { template_type, template_name, subject, html_body, is_active } = data;
        const [result] = await pool.query(
            `UPDATE email_templates 
             SET template_type = ?, template_name = ?, subject = ?, html_body = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [template_type, template_name, subject, html_body, is_active, id]
        );
        return this.findById(id);
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM email_templates WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async toggleActive(id) {
        const [result] = await pool.query(
            'UPDATE email_templates SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );
        return this.findById(id);
    }
}

module.exports = EmailTemplate;
