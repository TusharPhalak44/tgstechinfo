const { pool } = require('../config/database');
const slugify = require('slugify');

class Content {
    static async create(contentData) {
        const {
            user_id, content_type_id, category_id, title, short_description,
            tags, banner_image, pdf_file, custom_fields, content, webhook_url,
            webhook_field_mapping, builder_layout,
            seo_meta_title, seo_meta_description, seo_meta_keywords,
            scheduled_publish_date, status = 'draft'
        } = contentData;

        const slug = slugify(title, { lower: true, strict: true });
        const wordCount = (content || '').split(/\s+/).length;
        const reading_time = Math.ceil(wordCount / 200);

        const query = `
            INSERT INTO contents (
                user_id, content_type_id, category_id, title, slug,
                short_description, tags, banner_image, pdf_file, custom_fields, content, webhook_url,
                webhook_field_mapping, builder_layout,
                seo_meta_title, seo_meta_description, seo_meta_keywords,
                scheduled_publish_date, reading_time, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            user_id, content_type_id, category_id, title, slug,
            short_description, JSON.stringify(tags), banner_image,
            pdf_file || null,
            custom_fields ? JSON.stringify(custom_fields) : null,
            content,
            webhook_url || null,
            webhook_field_mapping ? JSON.stringify(webhook_field_mapping) : null,
            builder_layout || null,
            seo_meta_title, seo_meta_description, seo_meta_keywords,
            scheduled_publish_date, reading_time, status
        ];
        const [result] = await pool.query(query, values);
        return await Content.findById(result.insertId);
    }

    static async findById(id) {
        const query = `
            SELECT c.*, 
                   u.first_name, u.last_name, u.email as author_email,
                   ct.name as content_type_name,
                   cat.name as category_name, cat.slug as category_slug
            FROM contents c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE c.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0];
    }

    static async findBySlug(slug) {
        const query = `
            SELECT c.*, 
                   u.first_name, u.last_name, u.email as author_email,
                   ct.name as content_type_name,
                   cat.name as category_name, cat.slug as category_slug
            FROM contents c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE c.slug = ? AND c.status = 'published'
        `;
        const [rows] = await pool.query(query, [slug]);
        return rows[0];
    }

    static async findAll(filters = {}) {
        let baseWhere = ' WHERE 1=1';
        const values = [];

        if (filters.status) { baseWhere += ' AND c.status = ?'; values.push(filters.status); }
        if (filters.user_id) { baseWhere += ' AND c.user_id = ?'; values.push(filters.user_id); }
        if (filters.category_id) { baseWhere += ' AND c.category_id = ?'; values.push(filters.category_id); }
        if (filters.content_type_id) { baseWhere += ' AND c.content_type_id = ?'; values.push(filters.content_type_id); }

        // total count
        const countQuery = `SELECT COUNT(*) as total FROM contents c LEFT JOIN content_types ct ON c.content_type_id = ct.id LEFT JOIN categories cat ON c.category_id = cat.id${baseWhere}`;
        const [countRows] = await pool.query(countQuery, values);
        const total = countRows[0].total;

        let query = `
            SELECT c.*, 
                   u.first_name, u.last_name,
                   ct.name as content_type_name,
                   cat.name as category_name
            FROM contents c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            ${baseWhere} ORDER BY c.created_at DESC
        `;

        const pageValues = [...values];
        if (filters.limit) { query += ' LIMIT ?'; pageValues.push(filters.limit); }
        if (filters.offset !== undefined && filters.offset !== null) { query += ' OFFSET ?'; pageValues.push(filters.offset); }

        const [rows] = await pool.query(query, pageValues);
        return { rows, total };
    }

    static async update(id, contentData) {
        const allowedFields = [
            'title', 'short_description', 'tags', 'banner_image', 'pdf_file', 'custom_fields', 'content',
            'seo_meta_title', 'seo_meta_description', 'seo_meta_keywords',
            'scheduled_publish_date', 'status', 'category_id', 'content_type_id', 'webhook_url',
            'webhook_field_mapping', 'builder_layout'
        ];

        const updates = [];
        const values = [];

        for (const field of allowedFields) {
            if (contentData[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(contentData[field]);
            }
        }

        if (contentData.title) {
            const newSlug = slugify(contentData.title, { lower: true, strict: true });
            const [existing] = await pool.query('SELECT slug FROM contents WHERE id = ?', [id]);
            if (existing[0]?.slug !== newSlug) {
                const [conflict] = await pool.query('SELECT id FROM contents WHERE slug = ? AND id != ?', [newSlug, id]);
                updates.push('slug = ?');
                values.push(conflict.length > 0 ? `${newSlug}-${id}` : newSlug);
            }
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        await pool.query(`UPDATE contents SET ${updates.join(', ')} WHERE id = ?`, values);
        return await Content.findById(id);
    }

    static async updateStatus(id, status, admin_comment = null) {
        let query = 'UPDATE contents SET status = ?, updated_at = CURRENT_TIMESTAMP';
        const values = [status];

        if (admin_comment) { query += ', admin_comment = ?'; values.push(admin_comment); }
        if (status === 'published') { query += ', published_date = COALESCE(scheduled_publish_date, CURRENT_TIMESTAMP)'; }

        query += ' WHERE id = ?';
        values.push(id);

        await pool.query(query, values);
        return await Content.findById(id);
    }

    static async incrementViewCount(id) {
        await pool.query('UPDATE contents SET view_count = view_count + 1 WHERE id = ?', [id]);
    }

    static async getRelatedArticles(contentId, categoryId, limit = 3) {
        const query = `
            SELECT c.*, u.first_name, u.last_name
            FROM contents c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.category_id = ? AND c.id != ? AND c.status = 'published'
            ORDER BY c.published_date DESC
            LIMIT ?
        `;
        const [rows] = await pool.query(query, [categoryId, contentId, limit]);
        return rows;
    }

    static async delete(id) {
        await pool.query('DELETE FROM contents WHERE id = ?', [id]);
    }
}

module.exports = Content;
