const { pool } = require('../config/database');

class EmailTemplate {
    static async create(data) {
        const { template_type, template_name, subject, html_body, is_active = true, include_logo = false } = data;
        const [result] = await pool.query(
            `INSERT INTO email_templates (template_type, template_name, subject, html_body, is_active, include_logo)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [template_type, template_name, subject, html_body, is_active, include_logo]
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
        const { template_type, template_name, subject, html_body, is_active, include_logo } = data;
        
        // Build dynamic update query based on provided fields
        const updates = [];
        const values = [];
        
        if (template_type !== undefined) {
            updates.push('template_type = ?');
            values.push(template_type);
        }
        if (template_name !== undefined) {
            updates.push('template_name = ?');
            values.push(template_name);
        }
        if (subject !== undefined) {
            updates.push('subject = ?');
            values.push(subject);
        }
        if (html_body !== undefined) {
            updates.push('html_body = ?');
            values.push(html_body);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(is_active);
        }
        if (include_logo !== undefined) {
            updates.push('include_logo = ?');
            values.push(include_logo);
        }
        
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        
        const query = `UPDATE email_templates SET ${updates.join(', ')} WHERE id = ?`;
        const [result] = await pool.query(query, values);
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
