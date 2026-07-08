const Content = require('../models/Content');
const User = require('../models/User');
const LandingPage = require('../models/LandingPage');
const { pool } = require('../config/database');
const { sendEmail, accessGrantEmailTemplate } = require('../config/email');
const { createNotification } = require('./notificationController');

// ✅ Get pending content for review
exports.getPendingContent = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const filters = {
            limit: parseInt(limit),
            offset: parseInt(offset) || 0
        };

        if (status && status !== 'all') filters.status = status;

        const { rows, total } = await Content.findAll(filters);
        res.json({ data: rows, total });
    } catch (error) {
        console.error('Get pending content error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Review content - Approve, Reject, Request Changes, Publish
exports.reviewContent = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, comment } = req.body;

        const content = await Content.findById(id);
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        let status;
        let responseMessage;

        switch (action) {
            case 'approve':
                status = 'approved';
                responseMessage = 'Content approved successfully';
                break;
            case 'publish':
                status = 'published';
                responseMessage = 'Content published successfully';
                try { await sendEmail(content.author_email, 'Content Published', `Your content "${content.title}" has been published.`); } catch (e) { console.warn('Email failed:', e.message); }
                break;
            case 'reject':
                status = 'rejected';
                responseMessage = 'Content rejected';
                try { await sendEmail(content.author_email, 'Content Rejected', `Your content "${content.title}" has been rejected. Comment: ${comment || 'No specific reason provided'}`); } catch (e) { console.warn('Email failed:', e.message); }
                break;
            case 'request_changes':
                status = 'changes_requested';
                responseMessage = 'Changes requested';
                try { await sendEmail(content.author_email, 'Changes Requested for Your Content', `Changes have been requested for "${content.title}".<br><br>Comment: ${comment}`); } catch (e) { console.warn('Email failed:', e.message); }
                break;
            default:
                return res.status(400).json({ message: 'Invalid action' });
        }

        const updatedContent = await Content.updateStatus(id, status, comment);

        const notifMessages = {
            approved: `Your content "${content.title}" has been approved.`,
            published: `Your content "${content.title}" has been published.`,
            rejected: `Your content "${content.title}" has been rejected.${comment ? ' Reason: ' + comment : ''}`,
            changes_requested: `Changes requested for "${content.title}".${comment ? ' Comment: ' + comment : ''}`,
        };
        if (notifMessages[status]) {
            await createNotification(content.user_id, content.id, status, notifMessages[status]);
        }

        res.json({ message: responseMessage, content: updatedContent });
    } catch (error) {
        console.error('Review content error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Get content details for admin review
exports.getContentDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const content = await Content.findById(id);
        
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }
        
        res.json(content);
    } catch (error) {
        console.error('Get content details error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Get all content (with filters)
exports.getAllContent = async (req, res) => {
    try {
        const { status, user_id, category_id, content_type_id, limit = 20, offset = 0 } = req.query;
        const filters = {};
        
        if (status) filters.status = status;
        if (user_id) filters.user_id = user_id;
        if (category_id) filters.category_id = category_id;
        if (content_type_id) filters.content_type_id = content_type_id;
        if (limit) filters.limit = parseInt(limit);
        if (offset) filters.offset = parseInt(offset);

        const { rows } = await Content.findAll(filters);
        res.json(rows);
    } catch (error) {
        console.error('Get all content error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT id, first_name, last_name, email, role, is_active, created_at
            FROM users
            WHERE role != 'admin'
            ORDER BY created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Update user status (active/inactive)
exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        const user = await User.update(id, { is_active });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User status updated successfully', user });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Get user's content (for admin to see user's work)
exports.getUserContent = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await Content.findAll({ user_id: id });
        res.json(rows);
    } catch (error) {
        console.error('Get user content error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Admin edit content directly
exports.adminEditContent = async (req, res) => {
    try {
        const { id } = req.params;
        const content = await Content.findById(id);
        if (!content) return res.status(404).json({ message: 'Content not found' });

        const fields = ['title', 'short_description', 'content', 'category_id', 'content_type_id',
            'seo_meta_title', 'seo_meta_description', 'seo_meta_keywords', 'scheduled_publish_date', 'webhook_url'];

        const updateData = {};
        fields.forEach(f => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });

        if (req.body.tags) {
            const tags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
            updateData.tags = JSON.stringify(tags);
        }
        if (req.files?.banner_image?.[0]) updateData.banner_image = req.files.banner_image[0].filename;
        if (req.files?.pdf_file?.[0]) updateData.pdf_file = req.files.pdf_file[0].filename;
        if (req.body.custom_fields) updateData.custom_fields = req.body.custom_fields;

        const updated = await Content.update(id, updateData);
        res.json({ message: 'Content updated successfully', content: updated });
    } catch (error) {
        console.error('Admin edit content error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Get landing page submissions
exports.getSubmissions = async (req, res) => {
    try {
        const { content_id, limit = 50, offset = 0 } = req.query;
        const { rows, total } = await LandingPage.findAll({ content_id, limit, offset });
        res.json({ data: rows, total });
    } catch (error) {
        console.error('Get submissions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Get single submission by ID (public API for sharing)
exports.getSubmissionById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            `SELECT s.id, s.first_name, s.last_name, s.email, s.contact_number,
                    s.extra_fields, s.has_access, s.created_at,
                    c.title as content_title, c.slug as content_slug, c.pdf_file
             FROM landing_page_submissions s
             LEFT JOIN contents c ON s.content_id = c.id
             WHERE s.id = ?`,
            [id]
        );
        if (!rows[0]) return res.status(404).json({ message: 'Submission not found' });

        const row = rows[0];
        let extraFields = {};
        try { extraFields = row.extra_fields ? (typeof row.extra_fields === 'string' ? JSON.parse(row.extra_fields) : row.extra_fields) : {}; } catch {}

        res.json({
            id: row.id,
            submitted_at: row.created_at,
            has_access: !!row.has_access,
            article: {
                title: row.content_title,
                slug: row.content_slug,
                pdf_file: row.pdf_file ? `/uploads/${row.pdf_file}` : null
            },
            form_data: {
                first_name: row.first_name,
                last_name: row.last_name,
                email: row.email,
                mobile_number: row.contact_number,
                ...extraFields
            }
        });
    } catch (error) {
        console.error('Get submission by id error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Delete content
exports.deleteContent = async (req, res) => {
    try {
        const { id } = req.params;
        const content = await Content.findById(id);
        if (!content) return res.status(404).json({ message: 'Content not found' });
        await Content.delete(id);
        // Also delete related notifications
        await pool.query('DELETE FROM notifications WHERE content_id = ?', [id]);
        res.json({ message: 'Content deleted successfully' });
    } catch (error) {
        console.error('Delete content error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const [[{ totalContent }]] = await pool.query('SELECT COUNT(*) as totalContent FROM contents');
        const [[{ pendingReview }]] = await pool.query("SELECT COUNT(*) as pendingReview FROM contents WHERE status = 'pending'");
        const [[{ published }]] = await pool.query("SELECT COUNT(*) as published FROM contents WHERE status = 'published'");
        const [[{ totalUsers }]] = await pool.query("SELECT COUNT(*) as totalUsers FROM users WHERE role != 'admin'");
        res.json({ totalContent, pendingReview, published, totalUsers });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};