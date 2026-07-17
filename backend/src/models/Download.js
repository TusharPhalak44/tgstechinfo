const { pool } = require('../config/database');

class Download {
    static async create(downloadData) {
        const {
            session_uuid,
            consent_uuid,
            content_id,
            file_id,
            file_name,
            file_type,
            file_size
        } = downloadData;

        const query = `
            INSERT INTO downloads (
                session_uuid, consent_uuid, content_id, file_id, file_name,
                file_type, file_size, downloaded_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;

        const values = [
            session_uuid, consent_uuid, content_id, file_id, file_name,
            file_type, file_size
        ];

        const [result] = await pool.query(query, values);
        return await Download.findById(result.insertId);
    }

    static async findById(id) {
        const query = 'SELECT * FROM downloads WHERE id = ?';
        const [rows] = await pool.query(query, [id]);
        return rows[0];
    }

    static async findByContent(contentId) {
        const query = 'SELECT * FROM downloads WHERE content_id = ? ORDER BY downloaded_at DESC';
        const [rows] = await pool.query(query, [contentId]);
        return rows;
    }

    static async getDownloadStats(contentId) {
        const query = `
            SELECT 
                COUNT(*) as total_downloads,
                COUNT(DISTINCT session_uuid) as unique_downloads,
                file_type,
                AVG(file_size) as avg_file_size
            FROM downloads
            WHERE content_id = ?
            GROUP BY file_type
        `;

        const [rows] = await pool.query(query, [contentId]);
        return rows;
    }

    static async getPopularDownloads(limit = 10, filters = {}) {
        let baseWhere = ' WHERE 1=1';
        const values = [];

        if (filters.start_date) {
            baseWhere += ' AND downloaded_at >= ?';
            values.push(filters.start_date);
        }
        if (filters.end_date) {
            baseWhere += ' AND downloaded_at <= ?';
            values.push(filters.end_date);
        }

        const query = `
            SELECT 
                d.content_id,
                c.title as content_title,
                c.slug as content_slug,
                d.file_type,
                COUNT(*) as download_count,
                COUNT(DISTINCT d.session_uuid) as unique_downloads
            FROM downloads d
            LEFT JOIN contents c ON d.content_id = c.id
            ${baseWhere}
            GROUP BY d.content_id, c.title, c.slug, d.file_type
            ORDER BY download_count DESC
            LIMIT ?
        `;

        values.push(limit);
        const [rows] = await pool.query(query, values);
        return rows;
    }
}

module.exports = Download;
