const { pool } = require('../config/database');

class ContentType {
    static async findAll() {
        const [rows] = await pool.query('SELECT id, name, slug FROM content_types ORDER BY name');
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT id, name, slug FROM content_types WHERE id = ?', [id]);
        return rows[0];
    }

    static async findBySlug(slug) {
        const [rows] = await pool.query('SELECT id, name, slug FROM content_types WHERE slug = ?', [slug]);
        return rows[0];
    }
}

module.exports = ContentType;
