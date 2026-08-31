const { pool } = require('../config/database');

class Category {
    static async findAll(filters = {}) {
        let query = `
            SELECT c.id, c.name, c.slug, c.type, c.parent_id, 
                   COUNT(DISTINCT content.id) as content_count
            FROM categories c
            LEFT JOIN contents content ON c.id = content.category_id 
                AND content.status = 'published' AND content.is_visible_on_site = 1
            WHERE 1=1
        `;
        const values = [];

        if (filters.type) { query += ' AND c.type = ?'; values.push(filters.type); }
        if (filters.parent_id) { query += ' AND c.parent_id = ?'; values.push(filters.parent_id); }

        query += ' GROUP BY c.id, c.name, c.slug, c.type, c.parent_id ORDER BY c.name';
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

    static async create(categoryData) {
        const { name, slug, type, parent_id } = categoryData;
        const query = `
            INSERT INTO categories (name, slug, type, parent_id)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [name, slug, type || null, parent_id || null]);
        return await Category.findById(result.insertId);
    }

    static async update(id, categoryData) {
        const { name, slug, type, parent_id } = categoryData;
        const query = `
            UPDATE categories 
            SET name = ?, slug = ?, type = ?, parent_id = ?
            WHERE id = ?
        `;
        await pool.query(query, [name, slug, type || null, parent_id || null, id]);
        return await Category.findById(id);
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Category;
