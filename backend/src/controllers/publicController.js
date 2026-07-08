const Content = require('../models/Content');
const Category = require('../models/Category');
const ContentType = require('../models/ContentType');
const LandingPage = require('../models/LandingPage');
const { pool } = require('../config/database');
const { sendEmail, accessGrantEmailTemplate } = require('../config/email');
const https = require('https');
const http = require('http');

// Forward form data to client's external webhook URL
const forwardToWebhook = (webhookUrl, payload) => {
    try {
        const data = JSON.stringify(payload);
        const url = new URL(webhookUrl);
        const lib = url.protocol === 'https:' ? https : http;
        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        };
        const req = lib.request(options);
        req.on('error', (e) => console.warn('Webhook forward failed:', e.message));
        req.write(data);
        req.end();
    } catch (e) {
        console.warn('Webhook URL invalid:', e.message);
    }
};

const normalizeContentTypeSlug = (value) => {
    const slugMap = {
        articles: 'article',
        article: 'article',
        blogs: 'blog',
        blog: 'blog',
        news: 'news',
        webinars: 'webinar',
        webinar: 'webinar',
        events: 'event',
        event: 'event'
    };

    return slugMap[String(value || '').toLowerCase().trim()] || String(value || '').toLowerCase().trim();
};

exports.getPublishedContent = async (req, res) => {
    try {
        const { category, content_type, limit = 10, offset = 0 } = req.query;
        const filters = { status: 'published' };

        if (category) {
            if (/^\d+$/.test(category)) {
                filters.category_id = parseInt(category, 10);
            } else {
                const matchedCategory = await Category.findBySlug(category);
                if (matchedCategory) {
                    filters.category_id = matchedCategory.id;
                } else {
                    const matchedContentType = await ContentType.findBySlug(normalizeContentTypeSlug(category));
                    if (matchedContentType) {
                        filters.content_type_id = matchedContentType.id;
                    }
                }
            }
        }

        if (content_type) {
            if (/^\d+$/.test(content_type)) {
                filters.content_type_id = parseInt(content_type, 10);
            } else {
                const matchedContentType = await ContentType.findBySlug(normalizeContentTypeSlug(content_type));
                if (matchedContentType) {
                    filters.content_type_id = matchedContentType.id;
                }
            }
        }

        if (limit) filters.limit = parseInt(limit, 10);
        if (offset) filters.offset = parseInt(offset, 10);

        const { rows, total } = await Content.findAll(filters);
        res.json({ data: rows, total });
    } catch (error) {
        console.error('Get published content error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getContentBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const content = await Content.findBySlug(slug);

        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        // Get related articles
        const relatedArticles = await Content.getRelatedArticles(content.id, content.category_id);

        res.json({ content, relatedArticles });
    } catch (error) {
        console.error('Get content by slug error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.submitLandingPage = async (req, res) => {
    try {
        const { first_name, last_name, email, contact_number, content_id, extra_fields } = req.body;
        let normalizedContentId = content_id ? Number(content_id) : null;
        if (normalizedContentId && Number.isNaN(normalizedContentId)) normalizedContentId = null;

        const content = normalizedContentId ? await Content.findById(normalizedContentId) : null;
        if (!content) normalizedContentId = null;

        // Parse custom fields from content
        let customFields = [];
        if (content?.custom_fields) {
            try { customFields = JSON.parse(content.custom_fields); } catch { customFields = []; }
        }

        // Validate all required custom fields are present
        if (customFields.length > 0) {
            const extraData = extra_fields ? (typeof extra_fields === 'string' ? JSON.parse(extra_fields) : extra_fields) : {};
            for (const field of customFields) {
                const key = field.label || field.name; // label is used as key from frontend
                if (!extraData[key] || String(extraData[key]).trim() === '') {
                    return res.status(400).json({ message: `Field "${field.label || field.name}" is required` });
                }
            }
        }

        const extraData = extra_fields ? (typeof extra_fields === 'string' ? JSON.parse(extra_fields) : extra_fields) : null;

        const existing = await LandingPage.findByEmailAndContent(email, normalizedContentId);
        let submission;
        if (existing) {
            submission = await LandingPage.grantAccess(existing.id);
        } else {
            submission = await LandingPage.create({
                first_name, last_name, email, contact_number,
                content_id: normalizedContentId,
                extra_fields: extraData
            });
            await LandingPage.grantAccess(submission.id);
        }

        // Increment view count on successful form submission
        if (normalizedContentId) await Content.incrementViewCount(normalizedContentId);

        // Forward to client's external webhook if configured
        if (content?.webhook_url) {
            const webhookPayload = {
                event: 'form_submission',
                article_title: content.title,
                article_slug: content.slug,
                submitted_at: new Date().toISOString(),
                form_data: {
                    first_name,
                    last_name,
                    email,
                    contact_number,
                    ...(extraData || {})
                }
            };
            forwardToWebhook(content.webhook_url, webhookPayload);
        }

        const fullName = [first_name, last_name].filter(Boolean).join(' ') || 'there';
        const contentTitle = content?.title || 'the requested article';

        try {
            const emailHtml = accessGrantEmailTemplate(fullName, contentTitle);
            const emailResult = await sendEmail(email, 'Access Granted - TGS Tech Info', emailHtml);
            if (emailResult?.skipped) console.warn('Email skipped:', emailResult.reason);
        } catch (emailError) {
            console.warn('Email send skipped:', emailError.message);
        }

        res.json({
            message: 'Access granted successfully.',
            has_access: true,
            pdf_file: content?.pdf_file || null
        });
    } catch (error) {
        console.error('Landing page submission error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

exports.subscribeNewsletter = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Check if already subscribed
        const query = 'SELECT * FROM newsletter_subscribers WHERE email = $1';
        const existing = await pool.query(query, [email]);
        
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Email already subscribed' });
        }

        const insertQuery = 'INSERT INTO newsletter_subscribers (email) VALUES ($1) RETURNING *';
        const result = await pool.query(insertQuery, [email]);
        
        res.json({ message: 'Subscribed to newsletter successfully' });
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const { slug } = req.query;

        if (slug) {
            const category = await Category.findBySlug(slug);
            return res.json(category ? [category] : []);
        }

        const categories = await Category.findAll();
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getContentTypes = async (req, res) => {
    try {
        const contentTypes = await ContentType.findAll();
        res.json(contentTypes);
    } catch (error) {
        console.error('Get content types error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getPublicStats = async (req, res) => {
    try {
        const { pool } = require('../config/database');
        const [[{ totalPublished }]] = await pool.query("SELECT COUNT(*) as totalPublished FROM contents WHERE status = 'published'");
        const [[{ totalCategories }]] = await pool.query('SELECT COUNT(*) as totalCategories FROM categories');
        const [[{ totalAuthors }]] = await pool.query("SELECT COUNT(*) as totalAuthors FROM users WHERE role != 'admin'");
        const [[{ totalViews }]] = await pool.query('SELECT COALESCE(SUM(view_count),0) as totalViews FROM contents');
        res.json({ totalPublished, totalCategories, totalAuthors, totalViews });
    } catch (error) {
        console.error('Get public stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};