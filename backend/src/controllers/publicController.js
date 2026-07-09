const Content = require('../models/Content');
const Category = require('../models/Category');
const ContentType = require('../models/ContentType');
const LandingPage = require('../models/LandingPage');
const { pool } = require('../config/database');
const { sendEmail, accessGrantEmailTemplate, subscriptionEmailTemplate } = require('../config/email');
const axios = require('axios');

// Forward form data to client's external webhook URL
const forwardToWebhook = async (webhookUrl, payload) => {
    try {
        const response = await axios.post(webhookUrl, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });
        console.log(`Webhook delivered to ${webhookUrl} — status: ${response.status}`);
    } catch (e) {
        const status = e.response?.status;
        const body = e.response?.data;
        console.error(`Webhook failed [${webhookUrl}] — status: ${status || 'no response'} — error: ${e.message}`, body || '');
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
        event: 'event',
        whitepaper: 'whitepaper',
        'white-paper': 'whitepaper',
        'white paper': 'whitepaper',
        whitepapers: 'whitepaper'
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
        const { content_id, extra_fields } = req.body;
        let normalizedContentId = content_id ? Number(content_id) : null;
        if (normalizedContentId && Number.isNaN(normalizedContentId)) normalizedContentId = null;

        const content = normalizedContentId ? await Content.findById(normalizedContentId) : null;
        if (!content) normalizedContentId = null;

        // Parse custom fields definition from content
        let customFieldsDef = [];
        if (content?.custom_fields) {
            try {
                const raw = content.custom_fields;
                customFieldsDef = Array.isArray(raw) ? raw : JSON.parse(raw);
            } catch { customFieldsDef = []; }
        }
        console.log('customFieldsDef:', JSON.stringify(customFieldsDef));

        const extraData = extra_fields ? (typeof extra_fields === 'string' ? JSON.parse(extra_fields) : extra_fields) : {};

        // Validate required fields
        for (const field of customFieldsDef) {
            if (field.required !== false && (!extraData[field.name] || String(extraData[field.name]).trim() === '')) {
                return res.status(400).json({ message: `Field "${field.label || field.name}" is required` });
            }
        }

        // Find email field value for dedup check
        const emailField = customFieldsDef.find(f => f.type === 'email' || f.name === 'email' || (f.webhook_key || '').toLowerCase() === 'email');
        const emailValue = emailField ? extraData[emailField.name] : null;

        const existing = emailValue ? await LandingPage.findByEmailAndContent(emailValue, normalizedContentId) : null;
        if (!existing) {
            await LandingPage.create({ content_id: normalizedContentId, extra_fields: extraData });
        }

        if (normalizedContentId) await Content.incrementViewCount(normalizedContentId);

        // Always forward to webhook
        if (content?.webhook_url) {
            const webhookPayload = {};
            customFieldsDef.forEach(field => {
                const clientKey = (field.webhook_key || '').trim() || field.name;
                // value field.name se dhundho, nahi mila to webhook_key se try karo
                const value = extraData[field.name] ?? extraData[field.webhook_key] ?? extraData[clientKey] ?? '';
                webhookPayload[clientKey] = value;
            });
            console.log('Webhook payload:', JSON.stringify(webhookPayload));
            await forwardToWebhook(content.webhook_url, webhookPayload);
        }

        // Find name/email for email template
        const nameField = customFieldsDef.find(f => f.name === 'first_name' || f.name === 'name' || (f.webhook_key || '').toLowerCase().includes('name'));
        const fullName = nameField ? (extraData[nameField.name] || 'there') : 'there';
        const contentTitle = content?.title || 'the requested article';

        try {
            const emailHtml = accessGrantEmailTemplate(fullName, contentTitle);
            const emailResult = await sendEmail(emailValue, 'Access Granted - TGS Tech Info', emailHtml);
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

exports.subscribeContent = async (req, res) => {
    try {
        const { content_id, extra_fields } = req.body;
        if (!content_id) return res.status(400).json({ message: 'content_id is required' });

        const content = await Content.findById(Number(content_id));
        const extraData = extra_fields ? (typeof extra_fields === 'string' ? JSON.parse(extra_fields) : extra_fields) : {};

        let customFieldsDef = [];
        if (content?.custom_fields) {
            try {
                const raw = content.custom_fields;
                customFieldsDef = Array.isArray(raw) ? raw : JSON.parse(raw);
            } catch {}
        }

        const emailField = customFieldsDef.find(f => f.type === 'email' || f.name === 'email' || (f.webhook_key || '').toLowerCase() === 'email');
        const emailValue = emailField ? extraData[emailField.name] : null;
        const nameField = customFieldsDef.find(f => f.name === 'first_name' || f.name === 'name' || (f.webhook_key || '').toLowerCase().includes('name'));
        const fullName = nameField ? (extraData[nameField.name] || 'there') : 'there';
        const contentTitle = content?.title || 'the requested content';

        const existing = emailValue ? await LandingPage.findByEmailAndContent(emailValue, Number(content_id)) : null;
        if (!existing) {
            await LandingPage.create({ content_id: Number(content_id), extra_fields: { ...extraData, subscription: true } });
        }

        // Forward to webhook using each field's webhook_key
        if (content?.webhook_url) {
            const webhookPayload = {};
            customFieldsDef.forEach(field => {
                const clientKey = (field.webhook_key || '').trim() || field.name;
                const value = extraData[field.name] ?? extraData[field.webhook_key] ?? extraData[clientKey] ?? '';
                webhookPayload[clientKey] = value;
            });
            await forwardToWebhook(content.webhook_url, webhookPayload);
        }

        try {
            const emailHtml = subscriptionEmailTemplate(fullName, contentTitle);
            await sendEmail(emailValue, `Subscription Confirmed - ${contentTitle}`, emailHtml);
        } catch (e) {
            console.warn('Subscription email failed:', e.message);
        }

        res.json({ message: 'Subscription email sent successfully.' });
    } catch (error) {
        console.error('Subscribe content error:', error);
        res.status(500).json({ message: 'Server error' });
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

exports.getCategoriesWithCount = async (req, res) => {
    try {
        const { content_type } = req.query;
        const { pool } = require('../config/database');

        let contentTypeFilter = '';
        const values = [];

        if (content_type) {
            const normalizedSlug = normalizeContentTypeSlug(content_type);
            const matchedType = await ContentType.findBySlug(normalizedSlug);
            if (matchedType) {
                contentTypeFilter = ' AND c.content_type_id = ?';
                values.push(matchedType.id);
            }
        }

        // Get all categories with parent info
        const [categories] = await pool.query(
            'SELECT id, name, slug, parent_id FROM categories ORDER BY parent_id ASC, name ASC'
        );

        // Get count per category
        const countQuery = `
            SELECT cat.id, COUNT(c.id) as count
            FROM categories cat
            LEFT JOIN contents c ON c.category_id = cat.id AND c.status = 'published'${contentTypeFilter}
            GROUP BY cat.id
        `;
        const [counts] = await pool.query(countQuery, values);
        const countMap = {};
        counts.forEach(r => { countMap[r.id] = parseInt(r.count, 10); });

        // Build tree: parent categories with their subcategories
        const parents = categories.filter(c => !c.parent_id);
        const result = parents.map(parent => ({
            ...parent,
            count: countMap[parent.id] || 0,
            subcategories: categories
                .filter(c => c.parent_id === parent.id)
                .map(sub => ({ ...sub, count: countMap[sub.id] || 0 }))
        }));

        res.json(result);
    } catch (error) {
        console.error('Get categories with count error:', error);
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