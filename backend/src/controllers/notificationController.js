const { pool } = require('../config/database');

exports.getNotifications = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(
            `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
            [id, req.user.id]
        );
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createNotification = async (userId, contentId, type, message) => {
    try {
        await pool.query(
            `INSERT INTO notifications (user_id, content_id, type, message) VALUES (?, ?, ?, ?)`,
            [userId, contentId, type, message]
        );
    } catch (error) {
        console.error('Create notification error:', error.message);
    }
};

// Notify all admins
exports.notifyAdmins = async (contentId, type, message) => {
    try {
        const [admins] = await pool.query(`SELECT id FROM users WHERE role = 'admin'`);
        for (const admin of admins) {
            await pool.query(
                `INSERT INTO notifications (user_id, content_id, type, message) VALUES (?, ?, ?, ?)`,
                [admin.id, contentId, type, message]
            );
        }
    } catch (error) {
        console.error('Notify admins error:', error.message);
    }
};

exports.searchContent = async (req, res) => {
    try {
        const { q, category, content_type } = req.query;
        if (!q || q.trim().length < 2) return res.json([]);

        const term = `%${q.trim()}%`;
        let where = `c.status = 'published' AND (
            c.title LIKE ? OR
            c.short_description LIKE ? OR
            c.tags LIKE ? OR
            cat.name LIKE ? OR
            ct.name LIKE ?
        )`;
        const values = [term, term, term, term, term];

        if (category) { where += ` AND cat.slug = ?`; values.push(category); }
        if (content_type) { where += ` AND LOWER(ct.name) = ?`; values.push(content_type.toLowerCase()); }

        const [rows] = await pool.query(
            `SELECT c.id, c.title, c.slug, c.short_description, c.banner_image,
                    ct.name as content_type_name, cat.name as category_name, cat.slug as category_slug
             FROM contents c
             LEFT JOIN content_types ct ON c.content_type_id = ct.id
             LEFT JOIN categories cat ON c.category_id = cat.id
             WHERE ${where}
             ORDER BY c.published_date DESC LIMIT 8`,
            values
        );
        res.json(rows);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
