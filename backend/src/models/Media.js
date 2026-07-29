const { pool } = require('../config/database');

class Media {
    static async create(mediaData) {
        const { 
            filename, 
            original_name, 
            file_path, 
            file_type, 
            file_size, 
            mime_type, 
            folder, 
            uploaded_by 
        } = mediaData;
        
        const query = `
            INSERT INTO media_files (filename, original_name, file_path, file_type, file_size, mime_type, folder, uploaded_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [
            filename, 
            original_name, 
            file_path, 
            file_type, 
            file_size, 
            mime_type, 
            folder, 
            uploaded_by
        ]);
        
        return await Media.findById(result.insertId);
    }

    static async findById(id) {
        const [rows] = await pool.query(
            'SELECT * FROM media_files WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async findByFilename(filename) {
        const [rows] = await pool.query(
            'SELECT * FROM media_files WHERE filename = ?',
            [filename]
        );
        return rows[0];
    }

    static async findAll(filters = {}) {
        const { file_type, folder, uploaded_by, search, limit = 100, offset = 0 } = filters;
        
        let query = 'SELECT * FROM media_files WHERE 1=1';
        const params = [];
        
        if (file_type && file_type !== 'all') {
            query += ' AND file_type = ?';
            params.push(file_type);
        }
        
        if (folder && folder !== 'all') {
            query += ' AND folder = ?';
            params.push(folder);
        }
        
        if (uploaded_by) {
            query += ' AND uploaded_by = ?';
            params.push(uploaded_by);
        }
        
        if (search) {
            query += ' AND (original_name LIKE ? OR filename LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        
        const [rows] = await pool.query(query, params);
        return rows;
    }

    static async getCount(filters = {}) {
        const { file_type, folder, uploaded_by, search } = filters;
        
        let query = 'SELECT COUNT(*) as count FROM media_files WHERE 1=1';
        const params = [];
        
        if (file_type && file_type !== 'all') {
            query += ' AND file_type = ?';
            params.push(file_type);
        }
        
        if (folder && folder !== 'all') {
            query += ' AND folder = ?';
            params.push(folder);
        }
        
        if (uploaded_by) {
            query += ' AND uploaded_by = ?';
            params.push(uploaded_by);
        }
        
        if (search) {
            query += ' AND (original_name LIKE ? OR filename LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }
        
        const [rows] = await pool.query(query, params);
        return rows[0].count;
    }

    static async getFolderCounts() {
        const query = `
            SELECT folder, COUNT(*) as count 
            FROM media_files 
            GROUP BY folder
        `;
        const [rows] = await pool.query(query);
        
        const counts = {
            'All Media': 0,
            'Images': 0,
            'Videos': 0,
            'Documents': 0
        };
        
        rows.forEach(row => {
            counts[row.folder] = row.count;
            counts['All Media'] += row.count;
        });
        
        return counts;
    }

    static async delete(id) {
        const [result] = await pool.query(
            'DELETE FROM media_files WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async deleteByFilename(filename) {
        const [result] = await pool.query(
            'DELETE FROM media_files WHERE filename = ?',
            [filename]
        );
        return result.affectedRows > 0;
    }

    static async update(id, mediaData) {
        const { original_name, folder } = mediaData;
        const query = `
            UPDATE media_files 
            SET original_name = ?, folder = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        await pool.query(query, [original_name, folder, id]);
        return await Media.findById(id);
    }
}

module.exports = Media;
