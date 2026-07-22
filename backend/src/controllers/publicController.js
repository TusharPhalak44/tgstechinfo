const Content = require('../models/Content');
const Category = require('../models/Category');
const ContentType = require('../models/ContentType');
const LandingPage = require('../models/LandingPage');
const DataRequest = require('../models/DataRequest');
const ContactSubmission = require('../models/ContactSubmission');
const Download = require('../models/Download');
const { pool } = require('../config/database');
const { sendEmail, accessGrantEmailTemplate, subscriptionEmailTemplate, renderCaseStudyEmail } = require('../config/email');
const axios = require('axios');
const { insertIntoDynamicTable, getDynamicTableSubmissions, sanitizeColumnName } = require('../utils/dynamicTable');

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
        whitepapers: 'whitepaper',
        'case-study': 'case-study',
        'case study': 'case-study',
        casestudy: 'case-study',
        'case-studies': 'case-study',
        'case studies': 'case-study',
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
        const { content_id, extra_fields, ...rest } = req.body;
        
        let normalizedContentId = content_id ? Number(content_id) : null;
        if (normalizedContentId && Number.isNaN(normalizedContentId)) normalizedContentId = null;

        // If content_id is missing, try to resolve it from the Referer header slug
        // Uses findBySlugAny so draft/pending pages also work (findBySlug is published-only)
        if (!normalizedContentId) {
            // Fallback 1: slug passed as a query param (?slug=my-page-slug)
            const slugParam = req.query.slug;
            if (slugParam) {
                const c = await Content.findBySlugAny(slugParam);
                if (c) normalizedContentId = c.id;
            }
        }

        if (!normalizedContentId) {
            // Fallback 2: parse slug from the Referer header URL path (/content/:slug)
            const referer = req.headers.referer || req.headers.referrer;
            if (referer) {
                try {
                    const url = new URL(referer);
                    const pathParts = url.pathname.split('/');
                    const slugIndex = pathParts.indexOf('content');
                    if (slugIndex !== -1 && pathParts[slugIndex + 1]) {
                        const slug = pathParts[slugIndex + 1];
                        // findBySlugAny works for any status (draft, pending, published)
                        const c = await Content.findBySlugAny(slug);
                        if (c) normalizedContentId = c.id;
                    }
                } catch (e) {
                    console.error('Error parsing Referer header for slug:', e);
                }
            }
        }

        const content = normalizedContentId ? await Content.findById(normalizedContentId) : null;
        if (!content) {
            return res.status(404).json({ message: 'Content not found or invalid content ID' });
        }

        // Parse custom fields definition from content
        let customFieldsDef = [];
        if (content?.custom_fields) {
            try {
                const raw = content.custom_fields;
                customFieldsDef = Array.isArray(raw) ? raw : JSON.parse(raw);
            } catch { customFieldsDef = []; }
        }
        console.log('customFieldsDef:', JSON.stringify(customFieldsDef));

        // Get extra data. If extra_fields is not provided, use rest of root-level request body as extra data.
        let extraData = {};
        if (extra_fields) {
            extraData = typeof extra_fields === 'string' ? JSON.parse(extra_fields) : extra_fields;
        } else {
            extraData = rest;
        }

        // Normalize extraData keys to lowercase/sanitized form so lookup matches field name casing
        const normalizedExtraData = {};
        for (const [key, val] of Object.entries(extraData || {})) {
            normalizedExtraData[sanitizeColumnName(key)] = val;
        }

        // Validate required fields
        for (const field of customFieldsDef) {
            const val = normalizedExtraData[field.name] ?? '';
            if (field.required !== false && String(val).trim() === '') {
                return res.status(400).json({ message: `Field "${field.label || field.name}" is required` });
            }
        }

        // Find email field value for dedup check (use normalized names)
        const emailField = customFieldsDef.find(f => f.type === 'email' || f.name === 'email' || (f.webhook_key || '').toLowerCase() === 'email');
        const emailValue = emailField ? normalizedExtraData[emailField.name] : null;

        const existing = emailValue ? await LandingPage.findByEmailAndContent(emailValue, normalizedContentId) : null;
        if (!existing) {
            // Store in dynamic table if it exists
            try {
                await insertIntoDynamicTable(normalizedContentId, {
                    ...normalizedExtraData,
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent']
                });
            } catch (dynamicTableError) {
                console.error('Dynamic table insert failed, falling back to JSON:', dynamicTableError);
                // Fallback to JSON storage
                await LandingPage.create({ content_id: normalizedContentId, extra_fields: normalizedExtraData });
            }
        }

        if (normalizedContentId) await Content.incrementViewCount(normalizedContentId);

        // Always forward to webhook
        if (content?.webhook_url) {
            // Build payload using webhook_key (original field name) when available,
            // falling back to the normalized DB column name.
            // We also spread the raw submitted keys first so any camelCase or
            // original-casing fields the client wrote are preserved even when
            // webhook_key is not explicitly set in custom_fields.
            const webhookPayload = {};

            // Layer 1: include all raw submitted fields with their original keys
            // This preserves camelCase / original casing from the form HTML.
            const { content_id: _cid, extra_fields: _ef, ...rawSubmitted } = req.body;
            Object.assign(webhookPayload, rawSubmitted);

            // Layer 2: override / add using the custom_fields definition and webhook_key mapping
            customFieldsDef.forEach(field => {
                const clientKey = (field.webhook_key || '').trim() || field.name;
                const value = normalizedExtraData[field.name] ?? normalizedExtraData[clientKey] ?? '';
                webhookPayload[clientKey] = value;
            });

            console.log('[Webhook] URL:', content.webhook_url);
            console.log('[Webhook] Payload:', JSON.stringify(webhookPayload));
            await forwardToWebhook(content.webhook_url, webhookPayload);
        }

        // Find name/email for email template
        const nameField = customFieldsDef.find(f => f.name === 'first_name' || f.name === 'name' || (f.webhook_key || '').toLowerCase().includes('name'));
        const fullName = nameField ? (normalizedExtraData[nameField.name] || 'there') : 'there';
        const contentTitle = content?.title || 'the requested article';

        try {
            const emailHtml = accessGrantEmailTemplate(fullName, contentTitle);
            const emailResult = await sendEmail(emailValue, 'Access Granted - TGS Tech Info', emailHtml);
            if (emailResult?.skipped) console.warn('Email skipped:', emailResult.reason);
        } catch (emailError) {
            console.warn('Email send skipped:', emailError.message);
        }

        // Track download if PDF file exists
        if (content?.pdf_file) {
            try {
                const session_uuid = req.headers['x-session-uuid'] || req.body.session_uuid || null;
                const consent_uuid = req.headers['x-consent-uuid'] || req.body.consent_uuid || null;
                
                console.log('Download tracking attempt:', { 
                    session_uuid, 
                    consent_uuid, 
                    content_id: normalizedContentId,
                    pdf_file: content.pdf_file 
                });
                
                if (session_uuid && consent_uuid) {
                    const download = await Download.create({
                        session_uuid,
                        consent_uuid,
                        content_id: normalizedContentId,
                        file_id: content.pdf_file,
                        file_name: content.pdf_file,
                        file_type: 'application/pdf',
                        file_size: null
                    });
                    console.log('Download tracked successfully:', download);
                } else {
                    console.log('Download tracking skipped - missing session_uuid or consent_uuid');
                }
            } catch (downloadError) {
                console.error('Download tracking failed:', downloadError);
                // Don't fail the request if tracking fails
            }
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
            // Store in dynamic table if it exists
            try {
                await insertIntoDynamicTable(Number(content_id), {
                    ...extraData,
                    subscription: true,
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent']
                });
            } catch (dynamicTableError) {
                console.error('Dynamic table insert failed, falling back to JSON:', dynamicTableError);
                // Fallback to JSON storage
                await LandingPage.create({ content_id: Number(content_id), extra_fields: { ...extraData, subscription: true } });
            }
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
        const [existing] = await pool.query(
            'SELECT * FROM newsletter_subscribers WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Email already subscribed' });
        }

        // Generate unsubscribe token
        const crypto = require('crypto');
        const unsubscribeToken = crypto.randomBytes(32).toString('hex');

        await pool.query(
            'INSERT INTO newsletter_subscribers (email, unsubscribe_token) VALUES (?, ?)',
            [email, unsubscribeToken]
        );

        // Send confirmation email
        try {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const emailHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #1a237e; color: white; padding: 20px; text-align: center; }
                        .content { padding: 30px; background: #f5f5f5; }
                        .footer { padding: 20px; text-align: center; background: #e0e0e0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header"><h2>Newsletter Subscription Confirmed</h2></div>
                        <div class="content">
                            <h3>Welcome!</h3>
                            <p>Thank you for subscribing to the TGS Tech Info newsletter.</p>
                            <p>You'll receive the latest insights, case studies, and industry updates directly in your inbox.</p>
                            <p>If you have any questions, feel free to contact us at <a href="mailto:info@tgstechinfo.com">info@tgstechinfo.com</a></p>
                            <br>
                            <p>To unsubscribe, click <a href="${frontendUrl}/unsubscribe?token=${unsubscribeToken}">here</a></p>
                            <br>
                            <p>Regards,</p>
                            <p><strong>TGS Tech Info Team</strong></p>
                        </div>
                        <div class="footer"><p>© 2024 TGS Tech Info. All rights reserved.</p></div>
                    </div>
                </body>
                </html>
            `;
            await sendEmail(email, 'Newsletter Subscription Confirmed - TGS Tech Info', emailHtml);
        } catch (emailError) {
            console.warn('Newsletter confirmation email failed:', emailError.message);
        }

        res.json({ message: 'Subscribed to newsletter successfully' });
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.unsubscribeNewsletter = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ message: 'Unsubscribe token is required' });
        }

        // Find subscriber by token
        const [subscribers] = await pool.query(
            'SELECT * FROM newsletter_subscribers WHERE unsubscribe_token = ? AND is_active = 1',
            [token]
        );

        if (subscribers.length === 0) {
            return res.status(404).json({ message: 'Invalid or expired unsubscribe link' });
        }

        // Mark as unsubscribed
        await pool.query(
            'UPDATE newsletter_subscribers SET is_active = 0, unsubscribed_at = NOW() WHERE unsubscribe_token = ?',
            [token]
        );

        res.json({ message: 'Successfully unsubscribed from newsletter' });
    } catch (error) {
        console.error('Newsletter unsubscribe error:', error);
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

exports.submitDataRequest = async (req, res) => {
    try {
        const {
            first_name, last_name, email, phone, company, country, state,
            request_type: dsar_type, details
        } = req.body;

        if (!first_name || !last_name || !email || !dsar_type) {
            return res.status(400).json({ message: 'first_name, last_name, email, and request_type are required.' });
        }

        const record = await DataRequest.create({
            request_type: 'dsar',
            first_name, last_name, email, phone, company, country, state,
            dsar_type, details,
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        });

        try {
            await sendEmail(
                email,
                'Data Request Received — TGS Tech Info',
                `<p>Dear ${first_name},</p>
                 <p>We have received your data subject request (ID: <strong>#${record.id}</strong>).</p>
                 <p><strong>Request Type:</strong> ${dsar_type}</p>
                 <p>We will process your request within the legally required timeframe (GDPR: 30 days / CCPA: 45 days).</p>
                 <p>If you have any questions, contact us at <a href="mailto:privacy@tgstechinfo.com">privacy@tgstechinfo.com</a></p>
                 <p>— TGS Tech Info Privacy Team</p>`
            );
        } catch (e) {
            console.warn('DSAR confirmation email failed:', e.message);
        }

        res.json({ message: 'Data request submitted successfully.', id: record.id });
    } catch (error) {
        console.error('Submit data request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.submitDoNotSell = async (req, res) => {
    try {
        const {
            firstName, lastName, email, altEmail, phone, company, jobTitle,
            state, requestType: dns_type, description
        } = req.body;

        if (!firstName || !lastName || !email || !state || !dns_type) {
            return res.status(400).json({ message: 'firstName, lastName, email, state, and requestType are required.' });
        }

        const record = await DataRequest.create({
            request_type: 'do_not_sell',
            first_name: firstName,
            last_name: lastName,
            email,
            alt_email: altEmail,
            phone,
            company,
            job_title: jobTitle,
            state,
            dns_type,
            details: description,
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        });

        try {
            await sendEmail(
                email,
                'Opt-Out Request Received — TGS Tech Info',
                `<p>Dear ${firstName},</p>
                 <p>We have received your opt-out request (ID: <strong>#${record.id}</strong>).</p>
                 <p><strong>Request Type:</strong> ${dns_type}</p>
                 <p>We will process your request within 15 business days and suppress your information from applicable sale/sharing activities.</p>
                 <p>If you have any questions, contact us at <a href="mailto:privacy@tgstechinfo.com">privacy@tgstechinfo.com</a></p>
                 <p>— TGS Tech Info Privacy Team</p>`
            );
        } catch (e) {
            console.warn('DNS confirmation email failed:', e.message);
        }

        res.json({ message: 'Opt-out request submitted successfully.', id: record.id });
    } catch (error) {
        console.error('Submit do not sell error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.submitContact = async (req, res) => {
    try {
        const {
            full_name,
            email,
            company,
            inquiry_category = 'general',
            subject,
            message,
            consent_given = false
        } = req.body;

        // Validation
        if (!full_name || !email || !subject || !message) {
            return res.status(400).json({ message: 'full_name, email, subject, and message are required.' });
        }

        if (!consent_given) {
            return res.status(400).json({ message: 'You must agree to the Privacy Policy to submit.' });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email address.' });
        }

        const record = await ContactSubmission.create({
            full_name,
            email,
            company,
            inquiry_category,
            subject,
            message,
            consent_given,
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        });

        // Send confirmation email to user
        try {
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #0f2044;">Thank you for contacting TGS Tech Info</h2>
                    <p>Dear ${full_name},</p>
                    <p>We have received your message and will get back to you within 24-48 hours.</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <p><strong>Category:</strong> ${inquiry_category}</p>
                    <p>If you have any urgent questions, please email us directly at <a href="mailto:info@tgstechinfo.com">info@tgstechinfo.com</a></p>
                    <p>— TGS Tech Info Team</p>
                </div>
            `;
            await sendEmail(email, 'Contact Form Submission Received — TGS Tech Info', emailHtml);
        } catch (e) {
            console.warn('Contact confirmation email failed:', e.message);
        }

        // Send notification email to admin
        try {
            const adminEmailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #0f2044;">New Contact Form Submission</h2>
                    <p><strong>From:</strong> ${full_name} (${email})</p>
                    <p><strong>Company:</strong> ${company || 'N/A'}</p>
                    <p><strong>Category:</strong> ${inquiry_category}</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <p><strong>Message:</strong></p>
                    <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${message}</p>
                    <p>— TGS Tech Info System</p>
                </div>
            `;
            await sendEmail('info@tgstechinfo.com', `New Contact: ${subject}`, adminEmailHtml);
        } catch (e) {
            console.warn('Admin notification email failed:', e.message);
        }

        res.json({ 
            message: 'Contact form submitted successfully. We will get back to you soon.', 
            id: record.id 
        });
    } catch (error) {
        console.error('Submit contact error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getDynamicFormSubmissions = async (req, res) => {
    try {
        const { content_id } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        if (!content_id) {
            return res.status(400).json({ message: 'content_id is required' });
        }

        // Verify user has access to this content
        const content = await Content.findById(Number(content_id));
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        // Check if user owns this content or is admin
        if (content.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { rows, total } = await getDynamicTableSubmissions(Number(content_id), { limit, offset });
        res.json({ rows, total });
    } catch (error) {
        console.error('Get dynamic form submissions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// CASE STUDIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/public/case-studies
 * Returns up to `limit` published case-study content items.
 * Includes case_study_headline, case_study_summary, pdf_file, and slug.
 */
exports.getCaseStudies = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 2, 50);
        const offset = parseInt(req.query.offset, 10) || 0;

        const [rows] = await pool.query(
            `SELECT c.id, c.title, c.slug, c.short_description,
                    c.case_study_headline, c.case_study_summary,
                    c.banner_image, c.pdf_file, c.created_at, c.published_date,
                    ct.name AS content_type_name
             FROM contents c
             LEFT JOIN content_types ct ON ct.id = c.content_type_id
             WHERE c.status = 'published'
               AND ct.slug = 'case-study'
             ORDER BY c.published_date DESC, c.created_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        res.json({ data: rows, total: rows.length });
    } catch (error) {
        console.error('getCaseStudies error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * GET /api/public/case-study/:slug
 * Returns a single published case study by slug (no PDF url exposed until gate is passed).
 */
exports.getCaseStudyBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const [rows] = await pool.query(
            `SELECT c.id, c.title, c.slug, c.short_description,
                    c.case_study_headline, c.case_study_summary,
                    c.banner_image, c.pdf_file, c.created_at, c.published_date,
                    ct.name AS content_type_name
             FROM contents c
             LEFT JOIN content_types ct ON ct.id = c.content_type_id
             WHERE c.slug = ?
               AND c.status = 'published'
               AND ct.slug = 'case-study'
             LIMIT 1`,
            [slug]
        );
        if (!rows.length) return res.status(404).json({ message: 'Case study not found' });
        res.json({ data: rows[0] });
    } catch (error) {
        console.error('getCaseStudyBySlug error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * POST /api/public/case-study-gate
 * Body: { slug, name, email, contact }
 *
 * 1. Validates the case study exists and is published
 * 2. Stores the lead in case_study_submissions
 * 3. Sends the custom email template (or fallback) to the submitted email
 * 4. Returns the pdf_file path so the frontend can open the PDF
 */
exports.submitCaseStudyGate = async (req, res) => {
    try {
        const { slug, name, email, contact } = req.body;

        if (!slug || !name || !email || !contact) {
            return res.status(400).json({ message: 'slug, name, email, and contact are required.' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email address.' });
        }

        // Fetch case study (any status so staging previews also work)
        const [rows] = await pool.query(
            `SELECT c.id, c.title, c.slug, c.pdf_file, c.email_subject, c.email_template
             FROM contents c
             LEFT JOIN content_types ct ON ct.id = c.content_type_id
             WHERE c.slug = ?
               AND ct.slug = 'case-study'
             LIMIT 1`,
            [slug]
        );

        if (!rows.length) {
            return res.status(404).json({ message: 'Case study not found.' });
        }

        const caseStudy = rows[0];

        // Store lead
        await pool.query(
            `INSERT INTO case_study_submissions
                (content_id, name, email, contact, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                caseStudy.id,
                name.trim(),
                email.trim().toLowerCase(),
                contact.trim(),
                req.ip || null,
                req.headers['user-agent'] || null,
            ]
        );

        // Send email using custom template or fallback
        try {
            const emailHtml = renderCaseStudyEmail(caseStudy.email_template, {
                name,
                title: caseStudy.title,
                email,
                contact,
                slug: caseStudy.slug,
            });
            // Use custom subject if provided, otherwise use fallback
            const emailSubject = caseStudy.email_subject 
                ? renderCaseStudyEmail(caseStudy.email_subject, {
                    name,
                    title: caseStudy.title,
                    email,
                    contact,
                    slug: caseStudy.slug,
                })
                : `Your Case Study: ${caseStudy.title}`;
            const result = await sendEmail(
                email.trim().toLowerCase(),
                emailSubject,
                emailHtml
            );
            if (result?.skipped) console.warn('Case study email skipped:', result.reason);
        } catch (emailErr) {
            console.warn('Case study email failed (non-fatal):', emailErr.message);
        }

        res.json({
            message: 'Access granted.',
            pdf_file: caseStudy.pdf_file || null,
            slug: caseStudy.slug,
        });
    } catch (error) {
        console.error('submitCaseStudyGate error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
