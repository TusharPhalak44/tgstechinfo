const { pool } = require('../config/database');

class Category {
    static async findAll(filters = {}) {
        let query = 'SELECT id, name, slug, type, parent_id FROM categories WHERE 1=1';
        const values = [];

        if (filters.type) { query += ' AND type = ?'; values.push(filters.type); }
        if (filters.parent_id) { query += ' AND parent_id = ?'; values.push(filters.parent_id); }

        query += ' ORDER BY name';
        const [rows] = await pool.query(query, values);
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.query(
            'SELECT id, name, slug, type, parent_id FROM categories WHERE id = ?', [id]
        );
        return rows[0];
    }

    static async findBySlug(slug) {
        const [rows] = await pool.query(
            'SELECT id, name, slug, type, parent_id FROM categories WHERE slug = ?', [slug]
        );
        return rows[0];
    }
}

module.exports = Category;
