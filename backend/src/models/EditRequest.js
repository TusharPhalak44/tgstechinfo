const { pool } = require('../config/database');

class EditRequest {
    static async create(editRequestData) {
        const {
            content_id,
            requested_by,
            requested_to,
            admin_comment
        } = editRequestData;

        const query = `
            INSERT INTO content_edit_requests (content_id, requested_by, requested_to, admin_comment)
            VALUES (?, ?, ?, ?)
        `;

        const [result] = await pool.query(query, [content_id, requested_by, requested_to, admin_comment]);
        return await EditRequest.findById(result.insertId);
    }

    static async findById(id) {
        const query = `
            SELECT er.*, 
                   c.title as content_title,
                   c.status as content_status,
                   u1.first_name as requested_by_first_name,
                   u1.last_name as requested_by_last_name,
                   u1.email as requested_by_email,
                   u2.first_name as requested_to_first_name,
                   u2.last_name as requested_to_last_name,
                   u2.email as requested_to_email
            FROM content_edit_requests er
            LEFT JOIN contents c ON er.content_id = c.id
            LEFT JOIN users u1 ON er.requested_by = u1.id
            LEFT JOIN users u2 ON er.requested_to = u2.id
            WHERE er.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0];
    }

    static async findByContentId(contentId) {
        const query = `
            SELECT er.*, 
                   c.title as content_title,
                   c.status as content_status,
                   u1.first_name as requested_by_first_name,
                   u1.last_name as requested_by_last_name,
                   u1.email as requested_by_email,
                   u2.first_name as requested_to_first_name,
                   u2.last_name as requested_to_last_name,
                   u2.email as requested_to_email
            FROM content_edit_requests er
            LEFT JOIN contents c ON er.content_id = c.id
            LEFT JOIN users u1 ON er.requested_by = u1.id
            LEFT JOIN users u2 ON er.requested_to = u2.id
            WHERE er.content_id = ?
            ORDER BY er.created_at DESC
        `;
        const [rows] = await pool.query(query, [contentId]);
        return rows;
    }

    static async findByRequestedTo(userId, filters = {}) {
        let baseWhere = 'WHERE er.requested_to = ?';
        const values = [userId];

        if (filters.status) {
            baseWhere += ' AND er.status = ?';
            values.push(filters.status);
        }

        const query = `
            SELECT er.*, 
                   c.title as content_title,
                   c.status as content_status,
                   u1.first_name as requested_by_first_name,
                   u1.last_name as requested_by_last_name,
                   u1.email as requested_by_email
            FROM content_edit_requests er
            LEFT JOIN contents c ON er.content_id = c.id
            LEFT JOIN users u1 ON er.requested_by = u1.id
            ${baseWhere}
            ORDER BY er.created_at DESC
        `;

        const [rows] = await pool.query(query, values);
        return rows;
    }

    static async findAll(filters = {}) {
        let baseWhere = 'WHERE 1=1';
        const values = [];

        if (filters.status) {
            baseWhere += ' AND er.status = ?';
            values.push(filters.status);
        }
        if (filters.content_id) {
            baseWhere += ' AND er.content_id = ?';
            values.push(filters.content_id);
        }
        if (filters.requested_to) {
            baseWhere += ' AND er.requested_to = ?';
            values.push(filters.requested_to);
        }

        const query = `
            SELECT er.*, 
                   c.title as content_title,
                   c.status as content_status,
                   u1.first_name as requested_by_first_name,
                   u1.last_name as requested_by_last_name,
                   u1.email as requested_by_email,
                   u2.first_name as requested_to_first_name,
                   u2.last_name as requested_to_last_name,
                   u2.email as requested_to_email
            FROM content_edit_requests er
            LEFT JOIN contents c ON er.content_id = c.id
            LEFT JOIN users u1 ON er.requested_by = u1.id
            LEFT JOIN users u2 ON er.requested_to = u2.id
            ${baseWhere}
            ORDER BY er.created_at DESC
        `;

        const [rows] = await pool.query(query, values);
        return rows;
    }

    static async updateStatus(id, status, creatorComment = null) {
        let query = 'UPDATE content_edit_requests SET status = ?, updated_at = CURRENT_TIMESTAMP';
        const values = [status];

        if (creatorComment) {
            query += ', creator_comment = ?';
            values.push(creatorComment);
        }

        query += ' WHERE id = ?';
        values.push(id);

        await pool.query(query, values);
        return await EditRequest.findById(id);
    }

    static async update(id, updateData) {
        const allowedFields = ['admin_comment', 'creator_comment', 'status'];
        const updates = [];
        const values = [];

        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(updateData[field]);
            }
        }

        if (updates.length === 0) {
            return await EditRequest.findById(id);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const query = `UPDATE content_edit_requests SET ${updates.join(', ')} WHERE id = ?`;
        await pool.query(query, values);
        return await EditRequest.findById(id);
    }

    static async delete(id) {
        await pool.query('DELETE FROM content_edit_requests WHERE id = ?', [id]);
    }

    static async checkPendingEditRequest(contentId) {
        const query = `
            SELECT id FROM content_edit_requests 
            WHERE content_id = ? AND status = 'pending'
            LIMIT 1
        `;
        const [rows] = await pool.query(query, [contentId]);
        return rows.length > 0 ? rows[0].id : null;
    }

    static async checkActiveEditRequest(contentId) {
        const query = `
            SELECT id, status FROM content_edit_requests 
            WHERE content_id = ? AND status IN ('pending', 'accepted')
            ORDER BY created_at DESC
            LIMIT 1
        `;
        const [rows] = await pool.query(query, [contentId]);
        return rows.length > 0 ? rows[0] : null;
    }
}

module.exports = EditRequest;
