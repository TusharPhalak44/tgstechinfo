const Content = require('../models/Content');
const User = require('../models/User');
const LandingPage = require('../models/LandingPage');
const Category = require('../models/Category');
const DataRequest = require('../models/DataRequest');
const { pool } = require('../config/database');
const { sendEmail, accessGrantEmailTemplate, sendTemplatedEmail } = require('../config/email');
const { createNotification } = require('./notificationController');
const logAudit = require('../utils/auditLogger');

const stripEmDash = (val) => {
    if (typeof val === 'string') return val.replace(/—/g, '-');
    if (val && typeof val === 'object' && !Array.isArray(val)) {
        const out = {};
        for (const k of Object.keys(val)) out[k] = stripEmDash(val[k]);
        return out;
    }
    return val;
};

// ✅ Get pending content for review
exports.getPendingContent = async (req, res) => {
    try {
        const { status, page = 1, limit = 15 } = req.query;
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

        // Get user and category details for email templates
        const user = await User.findById(content.user_id);
        const category = await Category.findById(content.category_id);
        const rawFrontend = process.env.SITE_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
        const frontendUrl = rawFrontend.split(',')[0].trim();

        switch (action) {
            case 'approve':
                status = 'approved';
                responseMessage = 'Content approved successfully';
                try {
                    await sendTemplatedEmail('content_approved', user.email, {
                        first_name: user.first_name,
                        last_name: user.last_name,
                        content_title: content.title,
                        category: category?.name || 'Uncategorized',
                        approved_date: new Date().toLocaleDateString(),
                        dashboard_url: `${frontendUrl}/dashboard`
                    });
                } catch (e) { console.warn('Email failed:', e.message); }
                break;
            case 'publish':
                status = 'published';
                responseMessage = 'Content published successfully';
                try {
                    await sendTemplatedEmail('content_published', user.email, {
                        first_name: user.first_name,
                        last_name: user.last_name,
                        content_title: content.title,
                        category: category?.name || 'Uncategorized',
                        published_date: new Date().toLocaleDateString(),
                        article_url: `${frontendUrl}/article/${content.slug}`,
                        dashboard_url: `${frontendUrl}/dashboard`
                    });
                } catch (e) { console.warn('Email failed:', e.message); }
 
                break;
            case 'reject':
                status = 'rejected';
                responseMessage = 'Content rejected';
                try {
                    await sendTemplatedEmail('content_rejected', user.email, {
                        first_name: user.first_name,
                        last_name: user.last_name,
                        content_title: content.title,
                        category: category?.name || 'Uncategorized',
                        reviewed_date: new Date().toLocaleDateString(),
                        feedback: comment || 'No specific reason provided',
                        dashboard_url: `${frontendUrl}/dashboard`
                    });
                } catch (e) { console.warn('Email failed:', e.message); }
 
                break;
            case 'request_changes':
                status = 'changes_requested';
                responseMessage = 'Changes requested';
                try {
                    await sendTemplatedEmail('content_rejected', user.email, {
                        first_name: user.first_name,
                        last_name: user.last_name,
                        content_title: content.title,
                        category: category?.name || 'Uncategorized',
                        reviewed_date: new Date().toLocaleDateString(),
                        feedback: comment || 'Please review and make necessary changes.',
                        dashboard_url: `${frontendUrl}/dashboard`
                    });
                } catch (e) { console.warn('Email failed:', e.message); }
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

        // Log to audit logs
        await logAudit(req, action, 'content', id, `${action} content: ${content.title}${comment ? ' - ' + comment : ''}`, 'success');

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
        const { status, user_id, category_id, content_type, content_type_id, limit = 20, offset = 0 } = req.query;
        const filters = {};
        
        if (status) filters.status = status;
        if (user_id) filters.user_id = user_id;
        if (category_id) filters.category_id = category_id;
        
        // Handle content_type (slug) by converting to content_type_id
        if (content_type && !content_type_id) {
            const ContentType = require('../models/ContentType');
            const contentType = await ContentType.findBySlug(content_type);
            if (contentType) {
                filters.content_type_id = contentType.id;
            }
        } else if (content_type_id) {
            filters.content_type_id = content_type_id;
        }
        
        if (limit) filters.limit = parseInt(limit);
        if (offset) filters.offset = parseInt(offset);

        const { rows, total } = await Content.findAll(filters);
        res.json({ data: rows, total });
    } catch (error) {
        console.error('Get all content error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Admin create user
exports.createUser = async (req, res) => {
    try {
        const { first_name, last_name, email, password, role } = req.body;

        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({ message: 'first_name, last_name, email and password are required' });
        }

        const existing = await User.findByEmail(email);
        if (existing) {
            return res.status(409).json({ message: 'A user with that email already exists' });
        }

        const { hashPassword } = require('../config/auth');
        const password_hash = await hashPassword(password);

        const user = await User.create({
            first_name,
            last_name,
            email,
            password_hash,
            role: role || 'user'
        });

        delete user.password_hash;

        // Log to audit logs
        await logAudit(req, 'create', 'user', user.id, `Created user: ${user.email} with role ${user.role}`, 'success');

        res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
        console.error('Admin create user error:', error);
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

// ✅ Update user details
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, role } = req.body;

        // Check if user exists
        const existingUser = await User.findById(id);
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updateData = {};
        if (first_name !== undefined) updateData.first_name = first_name;
        if (last_name !== undefined) updateData.last_name = last_name;
        if (role !== undefined) updateData.role = role;

        const user = await User.update(id, updateData);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        delete user.password_hash;

        // Log to audit logs
        await logAudit(req, 'update', 'user', id, `Updated user details for: ${user.email}`, 'success');

        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        console.error('Update user error:', error);
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

        // Log to audit logs
        await logAudit(req, 'update', 'user', id, `Updated user status to ${is_active} for user: ${user.email}`, 'success');

        res.json({ message: 'User status updated successfully', user });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Delete user
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent deleting yourself
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        const deleted = await User.delete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Log to audit logs
        await logAudit(req, 'delete', 'user', id, `Deleted user with ID: ${id}`, 'success');

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
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
        if (req.body.webhook_field_mapping) updateData.webhook_field_mapping = req.body.webhook_field_mapping;

        const updated = await Content.update(id, stripEmDash(updateData));

        // Save banner image to media_files
        if (req.files?.banner_image?.[0]) {
            try {
                const bannerFile = req.files.banner_image[0];
                const ext = bannerFile.filename.split('.').pop().toLowerCase();
                const Media = require('../models/Media');
                const fileData = require('fs').readFileSync(bannerFile.path);
                await Media.create({
                    filename: bannerFile.filename,
                    original_name: bannerFile.originalname,
                    file_path: `/uploads/${bannerFile.filename}`,
                    file_type: ['jpg','jpeg','png','gif','webp'].includes(ext) ? 'image' : 'other',
                    file_size: bannerFile.size,
                    mime_type: bannerFile.mimetype,
                    folder: 'Images',
                    uploaded_by: req.user.id,
                    file_data: fileData
                });
            } catch (e) { console.error('Media save error:', e.message); }
        }
        // Save PDF to media_files
        if (req.files?.pdf_file?.[0]) {
            try {
                const pdfFile = req.files.pdf_file[0];
                const Media = require('../models/Media');
                const fileData = require('fs').readFileSync(pdfFile.path);
                await Media.create({
                    filename: pdfFile.filename,
                    original_name: pdfFile.originalname,
                    file_path: `/uploads/${pdfFile.filename}`,
                    file_type: 'document',
                    file_size: pdfFile.size,
                    mime_type: pdfFile.mimetype,
                    folder: 'Documents',
                    uploaded_by: req.user.id,
                    file_data: fileData
                });
            } catch (e) { console.error('Media save error:', e.message); }
        }

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
            `SELECT s.id, s.extra_fields, s.created_at,
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
            article: {
                title: row.content_title,
                slug: row.content_slug,
                pdf_file: row.pdf_file ? `/uploads/${row.pdf_file}` : null
            },
            form_data: extraFields
        });
    } catch (error) {
        console.error('Get submission by id error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Get data requests (DSAR + Do Not Sell)
exports.getDataRequests = async (req, res) => {
    try {
        const { status, request_type, limit = 50, offset = 0 } = req.query;
        const { rows, total } = await DataRequest.findAll({ status, request_type, limit, offset });
        res.json({ data: rows, total });
    } catch (error) {
        console.error('Get data requests error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Update data request status
exports.updateDataRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_notes } = req.body;
        const updated = await DataRequest.updateStatus(id, status, admin_notes);
        if (!updated) return res.status(404).json({ message: 'Request not found' });
        res.json({ message: 'Status updated successfully', data: updated });
    } catch (error) {
        console.error('Update data request status error:', error);
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
        const [[{ totalDrafts }]] = await pool.query("SELECT COUNT(*) as totalDrafts FROM contents WHERE status = 'draft'");
        const [[{ totalScheduled }]] = await pool.query("SELECT COUNT(*) as totalScheduled FROM contents WHERE status = 'scheduled'");
        const [[{ totalViews }]] = await pool.query('SELECT SUM(view_count) as totalViews FROM contents');
        const [[{ monthlyViews }]] = await pool.query('SELECT SUM(view_count) as monthlyViews FROM contents WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)');
        
        res.json({ 
            totalContent, 
            pendingReview, 
            totalPublished: published,
            totalDrafts,
            totalScheduled,
            totalUsers,
            totalViews: totalViews || 0,
            monthlyViews: monthlyViews || 0,
            avgReadTime: 5,
            engagementRate: 68
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Get recent activity
exports.getRecentActivity = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.id, c.title, c.status, c.updated_at,
                   ct.name as content_type
            FROM contents c
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            ORDER BY c.updated_at DESC
            LIMIT 10
        `);
        res.json(rows);
    } catch (error) {
        console.error('Get recent activity error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Get content by status
exports.getContentByStatus = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT status, COUNT(*) as count 
            FROM contents 
            GROUP BY status
        `);
        res.json(rows);
    } catch (error) {
        console.error('Get content by status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Dashboard KPIs — full metrics for ExecutiveKPICards (supports custom start_date & end_date)
exports.getDashboardKPIs = async (req, res) => {
    try {
        const { period = '30d', start_date, end_date } = req.query;
        let dateCondition = "updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        let pvCondition   = "entered_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        let vsCondition   = "session_start >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        let dateParams    = [];
        let pvParams      = [];
        let vsParams      = [];

        if (start_date && end_date) {
            dateCondition = "updated_at BETWEEN ? AND ?";
            pvCondition   = "entered_at BETWEEN ? AND ?";
            vsCondition   = "session_start BETWEEN ? AND ?";
            dateParams    = [`${start_date} 00:00:00`, `${end_date} 23:59:59`];
            pvParams      = [`${start_date} 00:00:00`, `${end_date} 23:59:59`];
            vsParams      = [`${start_date} 00:00:00`, `${end_date} 23:59:59`];
        } else {
            const periodMap = { 'today': 1, '7d': 7, '30d': 30, '90d': 90, 'ytd': 365, 'all': 36500 };
            const days = periodMap[period] || 30;
            dateCondition = "updated_at >= DATE_SUB(NOW(), INTERVAL ? DAY)";
            pvCondition   = "entered_at >= DATE_SUB(NOW(), INTERVAL ? DAY)";
            vsCondition   = "session_start >= DATE_SUB(NOW(), INTERVAL ? DAY)";
            dateParams    = [days];
            pvParams      = [days];
            vsParams      = [days];
        }

        const [[{ published }]]        = await pool.query(`SELECT COUNT(*) as published FROM contents WHERE status='published'`);
        const [[{ pending }]]          = await pool.query(`SELECT COUNT(*) as pending FROM contents WHERE status='pending'`);
        const [[{ drafts }]]           = await pool.query(`SELECT COUNT(*) as drafts FROM contents WHERE status='draft'`);
        const [[{ scheduled }]]        = await pool.query(`SELECT COUNT(*) as scheduled FROM contents WHERE status='scheduled'`);
        const [[{ totalViews }]]       = await pool.query(`SELECT COALESCE(SUM(view_count),0) as totalViews FROM contents`);
        const [[{ totalUsers }]]       = await pool.query(`SELECT COUNT(*) as totalUsers FROM users WHERE is_active=1`);
        const [[{ totalSubs }]]        = await pool.query(`SELECT COUNT(*) as totalSubs FROM newsletter_subscribers WHERE is_active=1`).catch(()=>[[{totalSubs:0}]]);
        
        const [[{ periodViews }]]      = await pool.query(`SELECT COALESCE(SUM(view_count),0) as periodViews FROM contents WHERE ${dateCondition}`, dateParams);
        const [[{ avgTime }]]          = await pool.query(`SELECT COALESCE(AVG(time_spent_seconds)/60,0) as avgTime FROM page_views WHERE ${pvCondition}`, pvParams).catch(()=>[[{avgTime:4.2}]]);
        const [[{ engagedSessions }]]  = await pool.query(`SELECT COUNT(*) as engagedSessions FROM visitor_sessions WHERE total_pages_visited > 1 AND ${vsCondition}`, vsParams).catch(()=>[[{engagedSessions:0}]]);
        const [[{ totalSessions }]]    = await pool.query(`SELECT COUNT(*) as totalSessions FROM visitor_sessions WHERE ${vsCondition}`, vsParams).catch(()=>[[{totalSessions:1}]]);
        const engagementRate = totalSessions > 0 ? Math.round((engagedSessions / totalSessions) * 100) : 0;

        res.json({
            totalPublished: published || 0,
            totalPending: pending || 0,
            totalDrafts: drafts || 0,
            totalScheduled: scheduled || 0,
            totalViews: totalViews || 0,
            totalUsers: totalUsers || 0,
            totalSubscribers: totalSubs || 0,
            avgReadTime: Math.round((avgTime || 4.2) * 10) / 10,
            engagementRate: engagementRate || 68,
            viewsDelta: 14.8,
        });
    } catch (error) {
        console.error('Get dashboard KPIs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Traffic Analytics — daily sessions + regional breakdown (supports custom start_date & end_date)
exports.getTrafficAnalytics = async (req, res) => {
    try {
        const { period = '30d', start_date, end_date } = req.query;
        let vsCondition = "session_start >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        let pvCondition = "entered_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        let vsParams = [];
        let pvParams = [];

        if (start_date && end_date) {
            vsCondition = "session_start BETWEEN ? AND ?";
            pvCondition = "entered_at BETWEEN ? AND ?";
            vsParams    = [`${start_date} 00:00:00`, `${end_date} 23:59:59`];
            pvParams    = [`${start_date} 00:00:00`, `${end_date} 23:59:59`];
        } else {
            const periodMap = { 'today': 1, '7d': 7, '30d': 30, '90d': 90, 'ytd': 365, 'all': 730 };
            const days = periodMap[period] || 30;
            vsCondition = "session_start >= DATE_SUB(NOW(), INTERVAL ? DAY)";
            pvCondition = "entered_at >= DATE_SUB(NOW(), INTERVAL ? DAY)";
            vsParams    = [days];
            pvParams    = [days];
        }

        // Daily sessions time series
        const [dailySessions] = await pool.query(`
            SELECT DATE(session_start) as date,
                   COUNT(*) as sessions,
                   COUNT(DISTINCT ip_address) as unique_users,
                   SUM(CASE WHEN total_pages_visited=1 THEN 1 ELSE 0 END) as bounces
            FROM visitor_sessions
            WHERE ${vsCondition}
            GROUP BY DATE(session_start)
            ORDER BY date ASC
        `, vsParams).catch(()=>[[]]);

        // Page views daily
        const [dailyPageViews] = await pool.query(`
            SELECT DATE(entered_at) as date, COUNT(*) as page_views
            FROM page_views
            WHERE ${pvCondition}
            GROUP BY DATE(entered_at)
            ORDER BY date ASC
        `, pvParams).catch(()=>[[]]);

        // Regional breakdown from visitor_sessions
        const [regional] = await pool.query(`
            SELECT 
                COALESCE(NULLIF(TRIM(country),''), 'Unknown') as region,
                COUNT(*) as sessions,
                ROUND(COUNT(*)*100.0/GREATEST((SELECT COUNT(*) FROM visitor_sessions WHERE ${vsCondition}), 1), 1) as pct
            FROM visitor_sessions
            WHERE ${vsCondition}
            GROUP BY region
            ORDER BY sessions DESC
            LIMIT 8
        `, [...vsParams, ...vsParams]).catch(()=>[[]]);

        // Summary stats
        const [[summary]] = await pool.query(`
            SELECT 
                COUNT(*) as totalSessions,
                COUNT(DISTINCT ip_address) as uniqueVisitors,
                COALESCE(AVG(total_session_duration),0) as avgDuration,
                SUM(CASE WHEN total_pages_visited=1 THEN 1 ELSE 0 END) as bounceCount
            FROM visitor_sessions
            WHERE ${vsCondition}
        `, vsParams).catch(()=>[[{totalSessions:0,uniqueVisitors:0,avgDuration:0,bounceCount:0}]]);

        const totalSessions = summary.totalSessions || 1;
        const bounceRate = Math.round((summary.bounceCount / totalSessions) * 100);

        res.json({ dailySessions, dailyPageViews, regional, summary: { ...summary, bounceRate } });
    } catch (error) {
        console.error('Get traffic analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Category, Technology, Industry, Resource & Insights Analytics (Real Database Counts)
exports.getCategoryAnalytics = async (req, res) => {
    try {
        const { period = '30d', start_date, end_date } = req.query;

        // 1. Technology Categories Breakdown (from categories WHERE type='technology' or type IS NULL)
        const [byTechnology] = await pool.query(`
            SELECT 
                cat.id, 
                cat.name, 
                cat.slug, 
                COALESCE(cat.type, 'technology') as type,
                COUNT(c.id) as count,
                COALESCE(SUM(c.view_count), 0) as total_views,
                ROUND(COALESCE(AVG(c.view_count), 0), 1) as avg_views,
                COUNT(CASE WHEN ct.slug IN ('article', 'interview', 'news', 'ebook', 'guide', 'report') THEN 1 END) as insights_count,
                COUNT(CASE WHEN ct.slug IN ('blog', 'whitepaper', 'webinar', 'event', 'case-study') THEN 1 END) as resources_count
            FROM categories cat
            LEFT JOIN contents c ON c.category_id = cat.id AND c.status='published'
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            WHERE cat.type = 'technology' OR cat.type IS NULL OR cat.type = ''
            GROUP BY cat.id, cat.name, cat.slug, cat.type
            ORDER BY total_views DESC, count DESC
        `);

        // 2. Industry Verticals Breakdown (from categories WHERE type='industry')
        const [byIndustry] = await pool.query(`
            SELECT 
                cat.id,
                cat.name as industry,
                cat.slug,
                COUNT(c.id) as count,
                COALESCE(SUM(c.view_count), 0) as views,
                ROUND(COALESCE(AVG(c.view_count), 0), 1) as avg_views,
                COUNT(CASE WHEN ct.slug IN ('article', 'interview', 'news', 'ebook', 'guide', 'report') THEN 1 END) as insights_count,
                COUNT(CASE WHEN ct.slug IN ('blog', 'whitepaper', 'webinar', 'event', 'case-study') THEN 1 END) as resources_count
            FROM categories cat
            LEFT JOIN contents c ON c.category_id = cat.id AND c.status='published'
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            WHERE cat.type = 'industry'
            GROUP BY cat.id, cat.name, cat.slug
            ORDER BY views DESC, count DESC
        `).catch(() => [[]]);

        // 3. Navbar Resources Breakdown (Blog, Whitepaper, Webinar, Event, Case Study)
        const [byResource] = await pool.query(`
            SELECT 
                ct.name as resource_type,
                ct.slug,
                COUNT(c.id) as count,
                COALESCE(SUM(c.view_count), 0) as views,
                ROUND(COALESCE(AVG(c.view_count), 0), 1) as avg_views
            FROM content_types ct
            LEFT JOIN contents c ON c.content_type_id = ct.id AND c.status='published'
            WHERE ct.slug IN ('blog', 'whitepaper', 'webinar', 'event', 'case-study')
               OR ct.name IN ('Blog', 'Whitepaper', 'Webinar', 'Event', 'Case Study')
            GROUP BY ct.id, ct.name, ct.slug
            ORDER BY count DESC, views DESC
        `).catch(() => [[]]);

        // 4. Navbar Insights Breakdown (Article, Interview, News, eBook, Guide, Report)
        const [byInsight] = await pool.query(`
            SELECT 
                ct.name as insight_type,
                ct.slug,
                COUNT(c.id) as count,
                COALESCE(SUM(c.view_count), 0) as views,
                ROUND(COALESCE(AVG(c.view_count), 0), 1) as avg_views
            FROM content_types ct
            LEFT JOIN contents c ON c.content_type_id = ct.id AND c.status='published'
            WHERE ct.slug IN ('article', 'interview', 'news', 'ebook', 'guide', 'report')
               OR ct.name IN ('Article', 'Interview', 'News', 'eBook', 'Guide', 'Report')
            GROUP BY ct.id, ct.name, ct.slug
            ORDER BY count DESC, views DESC
        `).catch(() => [[]]);

        // 5. Trending Categories
        const [trending] = await pool.query(`
            SELECT 
                cat.name, 
                COUNT(c.id) as count,
                COALESCE(SUM(c.view_count), 0) as total_views
            FROM categories cat
            JOIN contents c ON c.category_id = cat.id
            WHERE c.status='published'
            GROUP BY cat.id, cat.name
            ORDER BY total_views DESC
            LIMIT 6
        `).catch(() => [[]]);

        res.json({
            categories: byTechnology,
            byTechnology,
            byIndustry,
            byType: byIndustry,
            byResource,
            byInsight,
            trending
        });
    } catch (error) {
        console.error('Get category analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Lead Analytics — form submissions funnel & regional breakdown (supports custom start_date & end_date)
exports.getLeadAnalytics = async (req, res) => {
    try {
        const { period = '30d', start_date, end_date } = req.query;
        let subCondition = "created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        let vsCondition  = "session_start >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        let pvCondition  = "entered_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        let subParams    = [];
        let vsParams     = [];
        let pvParams     = [];

        if (start_date && end_date) {
            subCondition = "created_at BETWEEN ? AND ?";
            vsCondition  = "session_start BETWEEN ? AND ?";
            pvCondition  = "entered_at BETWEEN ? AND ?";
            subParams    = [`${start_date} 00:00:00`, `${end_date} 23:59:59`];
            vsParams     = [`${start_date} 00:00:00`, `${end_date} 23:59:59`];
            pvParams     = [`${start_date} 00:00:00`, `${end_date} 23:59:59`];
        } else {
            const periodMap = { 'today': 1, '7d': 7, '30d': 30, '90d': 90, 'ytd': 365, 'all': 36500 };
            const days = periodMap[period] || 30;
            subCondition = "created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)";
            vsCondition  = "session_start >= DATE_SUB(NOW(), INTERVAL ? DAY)";
            pvCondition  = "entered_at >= DATE_SUB(NOW(), INTERVAL ? DAY)";
            subParams    = [days];
            vsParams     = [days];
            pvParams     = [days];
        }

        // Total submissions in period
        const [[{ totalSubmissions }]] = await pool.query(
            `SELECT COUNT(*) as totalSubmissions FROM landing_page_submissions WHERE ${subCondition}`,
            subParams
        ).catch(()=>[[{totalSubmissions:0}]]);

        // Submissions per content (top 5 forms)
        const [byContent] = await pool.query(`
            SELECT c.title, COUNT(s.id) as submissions
            FROM landing_page_submissions s
            JOIN contents c ON s.content_id = c.id
            WHERE s.${subCondition}
            GROUP BY c.id, c.title
            ORDER BY submissions DESC
            LIMIT 5
        `, subParams).catch(()=>[[]]);

        // Daily submissions trend
        const [dailySubmissions] = await pool.query(`
            SELECT DATE(created_at) as date, COUNT(*) as submissions
            FROM landing_page_submissions
            WHERE ${subCondition}
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, subParams).catch(()=>[[]]);

        // Total visitors for funnel calculation
        const [[{ totalVisitors }]] = await pool.query(
            `SELECT COUNT(DISTINCT ip_address) as totalVisitors FROM visitor_sessions WHERE ${vsCondition}`,
            vsParams
        ).catch(()=>[[{totalVisitors:0}]]);

        const [[{ formPageViews }]] = await pool.query(
            `SELECT COUNT(*) as formPageViews FROM page_views WHERE page_type='landing_page' AND ${pvCondition}`,
            pvParams
        ).catch(()=>[[{formPageViews:0}]]);

        res.json({ totalSubmissions, totalVisitors, formPageViews, byContent, dailySubmissions });
    } catch (error) {
        console.error('Get lead analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Subscriber Analytics — newsletter growth over time
exports.getSubscriberAnalytics = async (req, res) => {
    try {
        // Monthly subscriber growth (last 12 months)
        const [monthlyGrowth] = await pool.query(`
            SELECT 
                DATE_FORMAT(created_at,'%Y-%m') as month,
                COUNT(*) as new_subscribers
            FROM newsletter_subscribers
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY month
            ORDER BY month ASC
        `).catch(()=>[[]]);

        // Total active subscribers
        const [[{ totalActive }]] = await pool.query(
            `SELECT COUNT(*) as totalActive FROM newsletter_subscribers WHERE is_active=1`
        ).catch(()=>[[{totalActive:0}]]);

        // Total inactive / unsubscribed
        const [[{ totalInactive }]] = await pool.query(
            `SELECT COUNT(*) as totalInactive FROM newsletter_subscribers WHERE is_active=0`
        ).catch(()=>[[{totalInactive:0}]]);

        // New this month
        const [[{ newThisMonth }]] = await pool.query(
            `SELECT COUNT(*) as newThisMonth FROM newsletter_subscribers WHERE created_at >= DATE_FORMAT(NOW(),'%Y-%m-01')`
        ).catch(()=>[[{newThisMonth:0}]]);

        res.json({ monthlyGrowth, totalActive, totalInactive, newThisMonth });
    } catch (error) {
        console.error('Get subscriber analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Content Portfolio — top articles by views + recent activity
exports.getContentPortfolio = async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const periodMap = { '7d':7,'30d':30,'90d':90,'ytd':365,'all':36500 };
        const days = periodMap[period] || 30;

        // Top articles by view_count
        const [topArticles] = await pool.query(`
            SELECT 
                c.id, c.title, c.slug, c.view_count as views,
                c.status, c.created_at, c.updated_at,
                cat.name as category,
                u.first_name, u.last_name
            FROM contents c
            LEFT JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.status='published'
            ORDER BY c.view_count DESC
            LIMIT 10
        `);

        // Recent editorial activity
        const [recentActivity] = await pool.query(`
            SELECT 
                c.id, c.title, c.status, c.updated_at,
                cat.name as category,
                u.first_name, u.last_name
            FROM contents c
            LEFT JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN users u ON c.user_id = u.id
            ORDER BY c.updated_at DESC
            LIMIT 8
        `);

        // Most viewed pages from page_views table
        const [topPages] = await pool.query(`
            SELECT 
                pv.page_url, pv.page_title,
                COUNT(*) as view_count,
                COUNT(DISTINCT pv.session_uuid) as unique_views,
                AVG(pv.time_spent_seconds) as avg_time,
                SUM(CASE WHEN pv.is_bounce=1 THEN 1 ELSE 0 END) as bounces
            FROM page_views pv
            WHERE pv.entered_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY pv.page_url, pv.page_title
            ORDER BY view_count DESC
            LIMIT 8
        `, [days]).catch(()=>[[]]);

        // Top Author Analytics & Contributors
        const [topAuthors] = await pool.query(`
            SELECT 
                u.id, u.first_name, u.last_name, u.email, u.role, u.is_active,
                COUNT(c.id) as article_count,
                COALESCE(SUM(c.view_count), 0) as total_views,
                ROUND(AVG(COALESCE(c.view_count, 0)), 1) as avg_views
            FROM users u
            LEFT JOIN contents c ON c.user_id = u.id AND c.status = 'published'
            GROUP BY u.id, u.first_name, u.last_name, u.email, u.role, u.is_active
            ORDER BY total_views DESC, article_count DESC
            LIMIT 8
        `).catch(()=>[[]]);

        // User role breakdown & activity
        const [userRoleStats] = await pool.query(`
            SELECT 
                COALESCE(role, 'author') as role,
                COUNT(*) as count,
                SUM(CASE WHEN is_active=1 THEN 1 ELSE 0 END) as active_count
            FROM users
            GROUP BY role
        `).catch(()=>[[]]);

        res.json({ topArticles, recentActivity, topPages, topAuthors, userRoleStats });
    } catch (error) {
        console.error('Get content portfolio error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Toggle content visibility on site
exports.toggleContentVisibility = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_visible_on_site } = req.body;

        if (is_visible_on_site === undefined) {
            return res.status(400).json({ message: 'is_visible_on_site is required' });
        }

        const content = await Content.findById(id);
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        const updatedContent = await Content.update(id, { is_visible_on_site });

        // Log to audit logs
        const visibilityStatus = is_visible_on_site ? 'visible' : 'hidden';
        await logAudit(
            req, 
            'update', 
            'content', 
            id, 
            `Changed content visibility to ${visibilityStatus}: ${content.title}`, 
            'success'
        );

        res.json({ 
            message: `Content ${visibilityStatus} on site successfully`, 
            content: updatedContent 
        });
    } catch (error) {
        console.error('Toggle content visibility error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};