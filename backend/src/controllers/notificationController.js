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
exports.notifyAdmins = async (contentId, type, title, message) => {
    try {
        const [admins] = await pool.query(`SELECT id FROM users WHERE role = 'admin'`);
        for (const admin of admins) {
            await pool.query(
                `INSERT INTO notifications (user_id, content_id, type, title, message) VALUES (?, ?, ?, ?, ?)`,
                [admin.id, contentId, type, title, message]
            );
        }
    } catch (error) {
        console.error('Notify admins error:', error.message);
    }
};

exports.getAdminNotifications = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        console.error('Get admin notifications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.markAdminAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(
            `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
            [id, req.user.id]
        );
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark admin notification as read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const TYPE_ALIASES = {
    'articles': 'article',
    'article': 'article',
    'blogs': 'blog',
    'blog': 'blog',
    'posts': 'blog',
    'post': 'blog',
    'blog posts': 'blog',
    'whitepapers': 'whitepaper',
    'whitepaper': 'whitepaper',
    'white papers': 'whitepaper',
    'white paper': 'whitepaper',
    'reports': 'report',
    'report': 'report',
    'studies': 'study',
    'study': 'study',
    'case studies': 'case study',
    'case study': 'case study',
    'case-studies': 'case study',
    'case-study': 'case study',
    'casestudies': 'case study',
    'webinars': 'webinar',
    'webinar': 'webinar',
    'events': 'event',
    'event': 'event',
    'interviews': 'interview',
    'interview': 'interview',
    'ebooks': 'ebook',
    'ebook': 'ebook',
    'e-books': 'ebook',
    'e-book': 'ebook',
    'guides': 'guide',
    'guide': 'guide',
    'news': 'news'
};

exports.searchContent = async (req, res) => {
    try {
        const { q, category, content_type } = req.query;
        if (!q || q.trim().length < 2) return res.json([]);

        const raw = q.trim();
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);

        // Normalize punctuation for token splitting (e.g. "Article - Technology" -> "Article Technology")
        const cleaned = raw.replace(/[-–—,/|:]+/g, ' ').replace(/\s+/g, ' ').trim();
        const stopWords = new Set(['in', 'on', 'for', 'of', 'and', 'the', 'a', 'an', 'with', 'by', 'to', 'from']);
        const rawTokens = cleaned.split(' ').map(t => t.trim().toLowerCase()).filter(Boolean);

        let tokens = rawTokens;
        if (rawTokens.length > 1) {
            const filtered = rawTokens.filter(t => !stopWords.has(t) && t.length >= 2);
            if (filtered.length > 0) tokens = filtered;
        }

        const baseWhere = `
            c.status = 'published' 
            AND (c.is_visible_on_site = 1 OR c.is_visible_on_site IS NULL) 
            AND (c.scheduled_publish_date IS NULL OR c.scheduled_publish_date <= CURRENT_TIMESTAMP) 
            AND NOT (
                ((ct.slug = 'event' OR c.content_type_id = 5) AND c.webinar_date IS NOT NULL AND c.webinar_date < CURRENT_TIMESTAMP)
                OR
                ((ct.slug = 'webinar' OR c.content_type_id = 4) AND (c.webinar_type = 'live' OR c.webinar_type IS NULL) AND c.webinar_date IS NOT NULL AND c.webinar_date < CURRENT_TIMESTAMP)
            )
        `;

        const values = [];
        const fullTerm = `%${raw}%`;

        // Multi-token match condition: every token must match title, description, tags, category, content type, or author
        const tokenClauses = [];
        tokens.forEach(tok => {
            const normalizedTok = TYPE_ALIASES[tok] || tok;
            let stem = normalizedTok;
            if (stem.endsWith('ies') && stem.length > 4) {
                stem = stem.slice(0, -3) + 'y';
            } else if (stem.endsWith('s') && stem.length > 3) {
                stem = stem.slice(0, -1);
            }

            const tokLike = `%${tok}%`;
            const normLike = `%${normalizedTok}%`;
            const stemLike = `%${stem}%`;

            tokenClauses.push(`(
                c.title LIKE ? OR
                c.short_description LIKE ? OR
                c.tags LIKE ? OR
                cat.name LIKE ? OR
                cat.slug LIKE ? OR
                cat.name LIKE ? OR
                ct.name LIKE ? OR
                ct.slug LIKE ? OR
                ct.name LIKE ? OR
                CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) LIKE ? OR
                u.first_name LIKE ? OR
                u.last_name LIKE ?
            )`);

            values.push(
                tokLike, tokLike, tokLike,
                tokLike, tokLike, stemLike,
                normLike, normLike, stemLike,
                tokLike, tokLike, tokLike
            );
        });

        let where = `${baseWhere} AND (${tokenClauses.join(' AND ')})`;

        if (category) {
            where += ` AND (cat.slug = ? OR cat.name LIKE ?)`;
            values.push(category, `%${category}%`);
        }
        if (content_type) {
            const normType = TYPE_ALIASES[content_type.toLowerCase()] || content_type.toLowerCase();
            where += ` AND (LOWER(ct.name) = ? OR ct.slug = ? OR LOWER(ct.name) LIKE ?)`;
            values.push(normType, normType, `%${normType}%`);
        }

        // Intelligent relevance scoring
        const scoreExprParts = [
            `(CASE WHEN c.title LIKE ? THEN 120 ELSE 0 END)`,
            `(CASE WHEN CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) LIKE ? THEN 80 ELSE 0 END)`,
            `(CASE WHEN cat.name LIKE ? OR cat.slug LIKE ? THEN 60 ELSE 0 END)`,
            `(CASE WHEN ct.name LIKE ? OR ct.slug LIKE ? THEN 60 ELSE 0 END)`
        ];
        const scoreValues = [fullTerm, fullTerm, fullTerm, fullTerm, fullTerm, fullTerm];

        // Add token scoring
        tokens.forEach(tok => {
            const norm = TYPE_ALIASES[tok] || tok;
            scoreExprParts.push(`(CASE WHEN c.title LIKE ? THEN 30 ELSE 0 END)`);
            scoreValues.push(`%${tok}%`);
            scoreExprParts.push(`(CASE WHEN cat.name LIKE ? OR cat.slug LIKE ? THEN 45 ELSE 0 END)`);
            scoreValues.push(`%${tok}%`, `%${tok}%`);
            scoreExprParts.push(`(CASE WHEN ct.name LIKE ? OR ct.slug LIKE ? THEN 45 ELSE 0 END)`);
            scoreValues.push(`%${norm}%`, `%${norm}%`);
            scoreExprParts.push(`(CASE WHEN CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) LIKE ? THEN 40 ELSE 0 END)`);
            scoreValues.push(`%${tok}%`);
        });

        const relevanceSql = scoreExprParts.join(' + ');

        const sql = `
            SELECT 
                c.id, c.title, c.slug, c.short_description, c.banner_image, c.reading_time, c.published_date,
                ct.name as content_type_name, ct.slug as content_type_slug,
                cat.name as category_name, cat.slug as category_slug,
                CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as author_name,
                u.avatar as author_avatar,
                u.id as author_id,
                (${relevanceSql}) as relevance_score
            FROM contents c
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN users u ON c.user_id = u.id
            WHERE ${where}
            ORDER BY relevance_score DESC, c.published_date DESC
            LIMIT ?
        `;

        const [rows] = await pool.query(sql, [
            ...scoreValues,
            ...values,
            limit
        ]);

        res.json(rows);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
