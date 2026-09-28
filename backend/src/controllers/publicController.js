const Content = require('../models/Content');
const Category = require('../models/Category');
const ContentType = require('../models/ContentType');
const LandingPage = require('../models/LandingPage');
const DataRequest = require('../models/DataRequest');
const ContactSubmission = require('../models/ContactSubmission');
const Download = require('../models/Download');
const { pool } = require('../config/database');
const { sendEmail, accessGrantEmailTemplate, subscriptionEmailTemplate, renderCaseStudyEmail, sendTemplatedEmail } = require('../config/email');
const axios = require('axios');
const { insertIntoDynamicTable, getDynamicTableSubmissions, sanitizeColumnName } = require('../utils/dynamicTable');

/**
 * Extract webhook URL (apiUrl) from Visual Builder JSON trees (builder_page_data or builder_layout)
 */
const extractWebhookUrlFromBuilder = (pageDataRaw) => {
    if (!pageDataRaw) return null;
    try {
        const pageData = typeof pageDataRaw === 'string' ? JSON.parse(pageDataRaw) : pageDataRaw;
        let found = null;
        const walk = (node) => {
            if (found || !node) return;
            if (node.type === 'form') {
                try {
                    const fc = typeof node.content === 'string' ? JSON.parse(node.content) : (node.content || {});
                    if (fc.apiUrl && typeof fc.apiUrl === 'string' && fc.apiUrl.trim()) {
                        found = fc.apiUrl.trim();
                    }
                } catch (e) { /* skip */ }
            }
            if (!found && Array.isArray(node.children)) {
                node.children.forEach(walk);
            }
        };
        const root = pageData?.layout || pageData?.root || pageData;
        if (Array.isArray(root)) {
            root.forEach(walk);
        } else {
            walk(root);
        }
        return found;
    } catch {
        return null;
    }
};

// Forward form data to client's external webhook URL
const isPrivateOrLoopbackHost = (hostname) => {
    if (!hostname) return true;
    const lower = hostname.toLowerCase();
    if (lower === 'localhost' || lower === '127.0.0.1' || lower === '0.0.0.0' || lower === '::1' || lower === '[::1]') return true;
    if (lower.endsWith('.local') || lower.endsWith('.internal') || lower.endsWith('.localhost')) return true;
    const ipv4Match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
        const [_, a, b] = ipv4Match.map(Number);
        if (a === 127) return true;
        if (a === 10) return true;
        if (a === 169 && b === 254) return true;
        if (a === 172 && b >= 16 && b <= 31) return true;
        if (a === 192 && b === 168) return true;
        if (a === 0) return true;
    }
    return false;
};

const forwardToWebhook = async (webhookUrl, payload) => {
    console.log(`[Webhook] Starting webhook call to: ${webhookUrl}`);
    console.log(`[Webhook] Payload size: ${JSON.stringify(payload).length} bytes`);
    
    try {
        // Validate webhook URL format
        if (!webhookUrl || typeof webhookUrl !== 'string') {
            throw new Error('Invalid webhook URL: URL is empty or not a string');
        }

        // Ensure URL has protocol
        let normalizedUrl = webhookUrl.trim();
        if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
            normalizedUrl = 'https://' + normalizedUrl;
        }

        const parsedUrl = new URL(normalizedUrl);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            throw new Error('Invalid webhook URL protocol. Only HTTP and HTTPS are allowed.');
        }

        if (isPrivateOrLoopbackHost(parsedUrl.hostname)) {
            throw new Error(`Webhook destination '${parsedUrl.hostname}' is prohibited (internal/private host).`);
        }

        console.log(`[Webhook] Normalized URL: ${normalizedUrl}`);
        console.log(`[Webhook] Sending payload:`, JSON.stringify(payload, null, 2));

        const startTime = Date.now();
        const response = await axios.post(normalizedUrl, payload, {
            headers: { 
                'Content-Type': 'application/json',
                'User-Agent': 'TGSTechInfo-Webhook/1.0',
                'X-Webhook-Source': 'TGSTechInfo-Platform'
            },
            timeout: 15000, // 15 second timeout
            maxRedirects: 3,
            validateStatus: (status) => status >= 200 && status < 500 // Don't throw on 4xx errors
        });
        
        const duration = Date.now() - startTime;
        console.log(`[Webhook] SUCCESS — ${normalizedUrl}`);
        console.log(`[Webhook] Response status: ${response.status} ${response.statusText}`);
        console.log(`[Webhook] Response time: ${duration}ms`);
        console.log(`[Webhook] Response data:`, JSON.stringify(response.data).substring(0, 500));
        
        return { success: true, status: response.status, data: response.data };
    } catch (e) {
        const duration = Date.now() - (e.config?._startTime || Date.now());
        const status = e.response?.status;
        const body = e.response?.data;
        const errorDetails = {
            url: webhookUrl,
            status: status || 'no response',
            error: e.message,
            code: e.code,
            responseData: body,
            duration: duration
        };

        console.error(`[Webhook] FAILED — ${webhookUrl}`);
        console.error(`[Webhook] Error details:`, JSON.stringify(errorDetails, null, 2));
        
        if (e.code === 'ECONNREFUSED') {
            console.error(`[Webhook] Connection refused - server may be down or URL is incorrect`);
        } else if (e.code === 'ETIMEDOUT' || e.code === 'ECONNABORTED') {
            console.error(`[Webhook] Request timed out after ${duration}ms`);
        } else if (e.response) {
            console.error(`[Webhook] Server responded with error ${status}: ${JSON.stringify(body)}`);
        } else if (e.request) {
            console.error(`[Webhook] No response received from server`);
        } else {
            console.error(`[Webhook] Request setup error: ${e.message}`);
        }

        // Re-throw to allow caller to handle
        throw new Error(`Webhook failed: ${e.message}`);
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
        // Landing page variants
        'landing-page': 'landing-page',
        'landing page': 'landing-page',
        'landingpage': 'landing-page',
        'landing-pages': 'landing-page',
        'landing pages': 'landing-page',
    };

    return slugMap[String(value || '').toLowerCase().trim()] || String(value || '').toLowerCase().trim();
};

exports.getPublishedContent = async (req, res) => {
    try {
        const { category, content_type, limit = 10, offset = 0, start_date, end_date } = req.query;
        const filters = { status: 'published', is_visible_on_site: true };

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

        // Add date filtering support
        if (start_date) filters.start_date = start_date;
        if (end_date) filters.end_date = end_date;

        // Safe pagination: default 10, max 100, min 1
        let parsedLimit = parseInt(limit, 10);
        if (isNaN(parsedLimit) || parsedLimit <= 0) {
            parsedLimit = 10;
        } else if (parsedLimit > 100) {
            parsedLimit = 100;
        }
        filters.limit = parsedLimit;

        let parsedOffset = parseInt(offset, 10);
        if (isNaN(parsedOffset) || parsedOffset < 0) {
            parsedOffset = 0;
        }
        filters.offset = parsedOffset;

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
        // Decode the slug if it was URL-encoded
        const decodedSlug = decodeURIComponent(slug);
        const content = await Content.findBySlugAny(decodedSlug);

        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        // Public content must be published
        if (content.status !== 'published') {
            return res.status(404).json({ message: 'Content not found' });
        }

        // Check if content is visible on site
        if (content.is_visible_on_site === false || content.is_visible_on_site === 0) {
            return res.status(404).json({ message: 'Content not found' });
        }

        // If scheduled for future, do not expose on public site
        if (content.scheduled_publish_date && new Date(content.scheduled_publish_date) > new Date()) {
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
        console.log('========== FORM SUBMISSION START ==========');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        
        const { content_id, extra_fields, ...rest } = req.body;
        
        let normalizedContentId = content_id ? Number(content_id) : null;
        if (normalizedContentId && Number.isNaN(normalizedContentId)) normalizedContentId = null;
        
        console.log('Normalized content_id:', normalizedContentId);

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

        // Validate required fields — only when customFieldsDef has entries
        // HTML builder pages often have no custom_fields definition; skip validation for them
        if (customFieldsDef.length > 0) {
            for (const field of customFieldsDef) {
                const val = normalizedExtraData[field.name] ?? '';
                if (field.required !== false && String(val).trim() === '') {
                    return res.status(400).json({ message: `Field "${field.label || field.name}" is required` });
                }
            }
        }

        // Find email field value for dedup check (use normalized names)
        const emailField = customFieldsDef.find(f => f.type === 'email' || f.name === 'email' || (f.webhook_key || '').toLowerCase() === 'email');
        const emailValue = emailField ? normalizedExtraData[emailField.name] : null;

        // Dedup: check the dynamic table first (primary storage).
        // Only fall back to landing_page_submissions if the dynamic table doesn't exist yet.
        let existing = null;
        if (emailValue) {
            try {
                const { pool: dbPool } = require('../config/database');
                const dynTable = `form_submissions_${normalizedContentId}`;
                const [dynTables] = await dbPool.query(`SHOW TABLES LIKE '${dynTable}'`);
                if (dynTables.length > 0) {
                    const [dupRows] = await dbPool.query(
                        `SELECT id FROM ${dynTable} WHERE email = ? LIMIT 1`,
                        [emailValue]
                    );
                    existing = dupRows[0] || null;
                } else {
                    // Dynamic table not yet created — check legacy JSON table
                    existing = await LandingPage.findByEmailAndContent(emailValue, normalizedContentId);
                }
            } catch (dedupErr) {
                // Non-fatal — if dedup check fails, allow the insert
                console.warn('[submitLandingPage] Dedup check failed (non-fatal):', dedupErr.message);
                existing = null;
            }
        }
        if (!existing) {
            console.log('No duplicate found, attempting to insert into dynamic table...');
            // Store in dynamic table — auto-create it if it doesn't exist yet
            try {
                console.log('Calling insertIntoDynamicTable with contentId:', normalizedContentId);
                console.log('Data to insert:', JSON.stringify({
                    ...normalizedExtraData,
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent']
                }, null, 2));
                
                await insertIntoDynamicTable(normalizedContentId, {
                    ...normalizedExtraData,
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent']
                });
                console.log('✅ Successfully inserted into dynamic table!');
            } catch (dynamicTableError) {
                console.error('❌ Dynamic table insert failed:', dynamicTableError);
                // Table doesn't exist — create it from submitted field names and retry
                if (dynamicTableError.message && dynamicTableError.message.includes('does not exist')) {
                    try {
                        // Build field definitions from submitted data
                        const autoFields = Object.keys(normalizedExtraData)
                            .filter(k => !['ip_address', 'user_agent'].includes(k))
                            .map(k => ({ name: k, label: k, type: 'text', required: false }));
                        
                        if (autoFields.length > 0) {
                            const { createDynamicTable } = require('../utils/dynamicTable');
                            await createDynamicTable(normalizedContentId, content.slug, autoFields);
                        }
                        
                        // Retry the insert
                        await insertIntoDynamicTable(normalizedContentId, {
                            ...normalizedExtraData,
                            ip_address: req.ip,
                            user_agent: req.headers['user-agent']
                        });
                    } catch (retryError) {
                        console.error('Auto-create table and retry failed, falling back to JSON:', retryError);
                        await LandingPage.create({ content_id: normalizedContentId, extra_fields: normalizedExtraData });
                    }
                } else {
                    console.error('Dynamic table insert failed, falling back to JSON:', dynamicTableError);
                    await LandingPage.create({ content_id: normalizedContentId, extra_fields: normalizedExtraData });
                }
            }
        } else {
            console.log('⚠️ Duplicate found, skipping insert. Existing record:', existing);
        }


        // ── Forward to webhook ────────────────────────────────────────────────────
        const debugTimestamp = new Date().toISOString();
        console.log('='.repeat(80));
        console.log(`[DEBUG ${debugTimestamp}] WEBHOOK CHECK STARTED`);
        console.log('[DEBUG] Checking webhook conditions...');
        console.log('[DEBUG] content exists?', !!content);
        console.log('[DEBUG] content.webhook_url:', content?.webhook_url);
        console.log('[DEBUG] Full content object:', JSON.stringify(content, null, 2));
        console.log('='.repeat(80));
        
        let targetWebhookUrl = (content?.webhook_url && typeof content.webhook_url === 'string') ? content.webhook_url.trim() : null;
        
        // Fallback 1: Extract webhook URL from content's builder_page_data / builder_layout if DB webhook_url is null
        if (!targetWebhookUrl && content) {
            const builderWebhook = extractWebhookUrlFromBuilder(content.builder_page_data) ||
                                   extractWebhookUrlFromBuilder(content.builder_layout) ||
                                   extractWebhookUrlFromBuilder(content.builder_content_elements);
            if (builderWebhook) {
                targetWebhookUrl = builderWebhook;
                console.log('[submitLandingPage] Fallback 1: Extracted webhook_url from content builder tree:', targetWebhookUrl);
                // Save back to contents table in background so future lookups are immediate
                if (normalizedContentId) {
                    pool.query('UPDATE contents SET webhook_url = ? WHERE id = ?', [targetWebhookUrl, normalizedContentId]).catch(err => console.error('[submitLandingPage] Failed to save extracted webhook_url:', err.message));
                }
            }
        }

        if (targetWebhookUrl) {
            console.log('[Webhook] ✅ Processing webhook for content:', normalizedContentId);
            console.log('[Webhook] Target Webhook URL:', targetWebhookUrl);
            
            // Build webhook payload:
            // 1. Start with original submitted fields
            const webhookPayload = { ...extraData };

            // 2. Apply explicit custom_fields webhook_key mappings if defined
            if (customFieldsDef && customFieldsDef.length > 0) {
                customFieldsDef.forEach(field => {
                    const clientKey = (field.webhook_key || '').trim();
                    if (clientKey && clientKey !== field.name) {
                        const val = extraData[field.name] ?? extraData[field.webhook_key] ?? extraData[clientKey] ?? normalizedExtraData[sanitizeColumnName(field.name)] ?? '';
                        if (val !== '') {
                            webhookPayload[clientKey] = val;
                        }
                    }
                });
            }

            // 3. Auto-alias snake_case <-> camelCase for standard lead form fields so any API endpoint works
            const keyAliases = [
                ['first_name', 'firstName'],
                ['last_name', 'lastName'],
                ['company_name', 'companyName'],
                ['company_name', 'company'],
                ['company', 'companyName'],
                ['job_title', 'jobTitle'],
                ['contact_number', 'contact'],
                ['phone_number', 'phone'],
                ['phone_number', 'phoneNumber'],
                ['phone', 'contact'],
                ['phone', 'phoneNumber'],
                ['email_address', 'email'],
                ['email', 'emailAddress'],
                ['first_name', 'name']
            ];

            for (const [snake, camel] of keyAliases) {
                if (webhookPayload[snake] !== undefined && webhookPayload[camel] === undefined) {
                    webhookPayload[camel] = webhookPayload[snake];
                } else if (webhookPayload[camel] !== undefined && webhookPayload[snake] === undefined) {
                    webhookPayload[snake] = webhookPayload[camel];
                }
            }

            // Create full name if first_name / last_name exist and name / fullName don't
            if ((webhookPayload.first_name || webhookPayload.firstName) && !webhookPayload.name) {
                const fn = webhookPayload.first_name || webhookPayload.firstName || '';
                const ln = webhookPayload.last_name || webhookPayload.lastName || '';
                webhookPayload.name = `${fn} ${ln}`.trim();
                webhookPayload.fullName = webhookPayload.name;
            }

            // 4. Add metadata fields if missing
            if (!webhookPayload.ip_address && req.ip) {
                webhookPayload.ip_address = req.ip;
            }
            if (!webhookPayload.user_agent && req.headers['user-agent']) {
                webhookPayload.user_agent = req.headers['user-agent'];
            }
            if (!webhookPayload.submitted_at) {
                webhookPayload.submitted_at = new Date().toISOString();
            }

            console.log('[Webhook] Final Webhook Payload:', JSON.stringify(webhookPayload, null, 2));
            
            // Call webhook
            forwardToWebhook(targetWebhookUrl, webhookPayload)
                .then((res) => {
                    console.log(`[Webhook] Successfully forwarded to client URL (${targetWebhookUrl}) - Status:`, res?.status);
                })
                .catch((err) => {
                    console.error('[Webhook] Failed to forward to client URL:', err.message);
                    pool.query(
                        'INSERT INTO webhook_failures (content_id, webhook_url, payload, error_message) VALUES (?, ?, ?, ?)',
                        [normalizedContentId, targetWebhookUrl, JSON.stringify(webhookPayload), err.message]
                    ).catch(dbErr => console.error('[Webhook] Failed to log webhook failure:', dbErr.message));
                });
        } else {
            console.log('[Webhook] No webhook URL configured or found for content:', normalizedContentId);
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

        // Resolve redirect URL from submitted form data or content configuration
        let redirectUrl = extraData?.redirect_url ||
                          extraData?.redirectUrl ||
                          extraData?.redirect ||
                          extraData?.return_url ||
                          extraData?.returnUrl ||
                          extraData?.thank_you_url ||
                          extraData?.thankYouUrl ||
                          extraData?.page_url ||
                          extraData?.pageUrl ||
                          extraData?.target_url ||
                          extraData?.targetUrl ||
                          extraData?.success_url ||
                          extraData?.successUrl ||
                          extraData?.download_url ||
                          extraData?.downloadUrl ||
                          content?.redirect_url ||
                          content?.join_link ||
                          null;

        if (redirectUrl && typeof redirectUrl === 'string') {
            redirectUrl = redirectUrl.trim();
            if (
                redirectUrl.includes('/api/public/landing-page') ||
                redirectUrl.includes('/api/users') ||
                redirectUrl === '#' ||
                redirectUrl.startsWith('javascript:')
            ) {
                redirectUrl = null;
            }
        }

        res.json({
            message: 'Access granted successfully.',
            has_access: true,
            pdf_file: content?.pdf_file || null,
            redirect_url: redirectUrl || null
        });
        console.log('========== FORM SUBMISSION END (SUCCESS) ==========');
    } catch (error) {
        console.error('========== FORM SUBMISSION ERROR ==========');
        console.error('Landing page submission error:', error);
        console.error('Stack trace:', error.stack);
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

        // Send confirmation email (simplified version without template dependency)
        try {
            const { sendEmail } = require('../config/email');
            const rawFrontend = process.env.SITE_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
            const frontendUrl = rawFrontend.split(',')[0].trim();
            
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #0AAEEF; color: white; padding: 20px; text-align: center; }
                        .content { padding: 30px; background: #f5f5f5; }
                        .footer { padding: 20px; text-align: center; background: #e0e0e0; }
                        .button { display: inline-block; padding: 12px 24px; background: #0AAEEF; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>Newsletter Subscription Confirmed</h2>
                        </div>
                        <div class="content">
                            <h3>Hi ${email.split('@')[0]},</h3>
                            <p>Thank you for subscribing to our newsletter! You'll now receive the latest technology insights and updates.</p>
                            <p>We'll keep you informed about:</p>
                            <ul>
                                <li>Latest technology trends</li>
                                <li>Industry insights</li>
                                <li>New content and resources</li>
                                <li>Expert opinions and analysis</li>
                            </ul>
                            <p>Visit our website: <a href="${frontendUrl}">${frontendUrl}</a></p>
                            <p style="margin-top: 20px; font-size: 12px; color: #666;">
                                To unsubscribe from our newsletter, click <a href="${frontendUrl}/unsubscribe?token=${unsubscribeToken}">here</a>
                            </p>
                        </div>
                        <div class="footer">
                            <p>© 2024 TGS Tech Info. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `;
            
            await sendEmail(email, 'Newsletter Subscription Confirmed', htmlContent);
        } catch (emailError) {
            console.warn('Newsletter confirmation email failed:', emailError.message);
            // Don't fail the subscription if email fails
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
        const { slug, start_date, end_date } = req.query;

        if (slug) {
            const category = await Category.findBySlug(slug);
            return res.json(category ? [category] : []);
        }

        // If date range is provided, we need to get filtered counts
        if (start_date || end_date) {
            const { pool } = require('../config/database');
            const categories = await Category.findAll();
            const categoryIds = categories.map(c => c.id);
            
            if (categoryIds.length > 0) {
                let dateFilter = '';
                const values = [...categoryIds];
                
                if (start_date) {
                    dateFilter += ' AND c.created_at >= ?';
                    values.push(start_date);
                }
                if (end_date) {
                    dateFilter += ' AND c.created_at <= ?';
                    values.push(end_date);
                }
                
                // Get content counts for each category within date range
                const countQuery = `
                    SELECT category_id, COUNT(*) as count
                    FROM contents c
                    WHERE category_id IN (${categoryIds.map(() => '?').join(',')})
                    AND (c.status = 'published' OR c.status IS NULL)
                    ${dateFilter}
                    GROUP BY category_id
                `;
                
                const [counts] = await pool.query(countQuery, values);
                const countMap = {};
                counts.forEach(r => { countMap[r.category_id] = parseInt(r.count, 10); });
                
                const totalFiltered = Object.values(countMap).reduce((a, b) => a + b, 0);

                // If date-restricted filter yields counts, use them; otherwise fallback to Category.findAll() counts
                if (totalFiltered > 0) {
                    const categoriesWithCounts = categories.map(cat => ({
                        ...cat,
                        content_count: countMap[cat.id] || 0
                    }));
                    return res.json(categoriesWithCounts);
                }
            }
            res.json(categories);
        } else {
            // Without date filter, use Category.findAll which already includes content_count
            const categories = await Category.findAll();
            res.json(categories);
        }
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

exports.getContentTypeCounts = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        const { pool } = require('../config/database');
        
        let dateFilter = '';
        const values = [];
        
        if (start_date) {
            dateFilter += ' AND c.created_at >= ?';
            values.push(start_date);
        }
        if (end_date) {
            dateFilter += ' AND c.created_at <= ?';
            values.push(end_date);
        }
        
        let [rows] = await pool.query(
            `SELECT ct.slug, COUNT(c.id) as count
             FROM content_types ct
             LEFT JOIN contents c ON c.content_type_id = ct.id AND (c.status = 'published' OR c.status IS NULL)
             ${dateFilter}
             GROUP BY ct.id, ct.slug`,
            values
        );

        const totalWithFilter = rows.reduce((sum, r) => sum + parseInt(r.count || 0, 10), 0);

        // If date-restricted filter yields 0 (no newly created items in range), fallback to overall published counts per content type
        if (totalWithFilter === 0) {
            [rows] = await pool.query(
                `SELECT ct.slug, COUNT(c.id) as count
                 FROM content_types ct
                 LEFT JOIN contents c ON c.content_type_id = ct.id
                 GROUP BY ct.id, ct.slug`
            );
        }

        const counts = {};
        rows.forEach(r => { counts[r.slug] = parseInt(r.count, 10); });
        res.json(counts);
    } catch (error) {
        console.error('Get content type counts error:', error);
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
            LEFT JOIN contents c ON c.category_id = cat.id AND c.status = 'published' AND c.is_visible_on_site = 1${contentTypeFilter}
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

exports.getTopCategoriesByViews = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const { pool } = require('../config/database');

        // Get categories sorted by total views of their content
        const query = `
            SELECT 
                cat.id, 
                cat.name, 
                cat.slug, 
                cat.parent_id,
                COALESCE(SUM(c.view_count), 0) as total_views,
                COUNT(c.id) as content_count
            FROM categories cat
            LEFT JOIN contents c ON c.category_id = cat.id AND c.status = 'published' AND c.is_visible_on_site = 1
            WHERE (cat.parent_id IS NULL OR cat.parent_id = 0)
            GROUP BY cat.id, cat.name, cat.slug, cat.parent_id
            ORDER BY total_views DESC, content_count DESC
            LIMIT ?
        `;

        const [categories] = await pool.query(query, [parseInt(limit)]);

        res.json(categories);
    } catch (error) {
        console.error('Get top categories by views error:', error);
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
               AND c.is_visible_on_site = 1
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
               AND c.is_visible_on_site = 1
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

        // Send email using database template or fallback
        try {
            // First try to use the database template for case_study_download
            const templateResult = await sendTemplatedEmail('case_study_download', email.trim().toLowerCase(), {
                name,
                title: caseStudy.title,
                email,
                contact,
                slug: caseStudy.slug,
                year: new Date().getFullYear()
            });
            
            // If database template is not found or skipped, fall back to custom template or default
            if (templateResult?.skipped) {
                console.log('Database template not found, using fallback template');
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
                const fallbackResult = await sendEmail(
                    email.trim().toLowerCase(),
                    emailSubject,
                    emailHtml
                );
                if (fallbackResult?.skipped) console.warn('Case study email skipped:', fallbackResult.reason);
            }
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

exports.registerWebinar = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, email, job_title, company_name, contact_number } = req.body;

        if (!first_name || !last_name || !email) {
            return res.status(400).json({ message: 'First name, last name, and email are required.' });
        }

        const Content = require('../models/Content');
        const webinar = await Content.findById(id);
        if (!webinar) {
            return res.status(404).json({ message: 'Webinar not found' });
        }

        const [result] = await pool.query(
            `INSERT INTO webinar_registrations 
            (webinar_id, first_name, last_name, email, job_title, company_name, contact_number) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                first_name.trim(),
                last_name.trim(),
                email.trim().toLowerCase(),
                job_title ? job_title.trim() : null,
                company_name ? company_name.trim() : null,
                contact_number ? contact_number.trim() : null
            ]
        );

        console.log(`[registerWebinar] Registration saved with ID ${result.insertId} for webinar ${id}`);

        // Send webinar registration confirmation email
        const attendeeEmail = email.trim().toLowerCase();
        const webinarTitle = webinar.title || 'Webinar';
        const joinLink = webinar.join_link || '';
        const webinarDateStr = webinar.webinar_date ? new Date(webinar.webinar_date).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' }) : 'Scheduled Date & Time';

        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 20px auto; padding: 0; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
                    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
                    .content { padding: 32px 24px; background: #ffffff; }
                    .info-box { background: #f8fafc; padding: 20px; border-left: 4px solid #3b82f6; margin: 24px 0; border-radius: 6px; }
                    .button { display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(37,99,235,0.4); }
                    .footer { padding: 24px; text-align: center; color: #94a3b8; font-size: 12px; background: #f1f5f9; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2 style="margin:0;font-size:22px;">🎉 Registration Confirmed</h2>
                        <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">TGS Tech Info Live Series</p>
                    </div>
                    <div class="content">
                        <h3 style="color:#0f172a;margin-top:0;">Hi ${first_name.trim()},</h3>
                        <p>Thank you for registering! Your complimentary virtual pass for our live technical webinar has been reserved.</p>
                        
                        <div class="info-box">
                            <h4 style="margin:0 0 12px;color:#0f172a;font-size:16px;">${webinarTitle}</h4>
                            <p style="margin:6px 0;font-size:14px;"><strong>📅 Date & Time:</strong> ${webinarDateStr}</p>
                            ${webinar.hosted_by ? `<p style="margin:6px 0;font-size:14px;"><strong>👤 Hosted By:</strong> ${webinar.hosted_by}</p>` : ''}
                            ${webinar.platform ? `<p style="margin:6px 0;font-size:14px;"><strong>💻 Platform:</strong> ${webinar.platform}</p>` : ''}
                        </div>

                        ${joinLink ? `
                            <p>You can join the webinar session directly using the link below at the scheduled time:</p>
                            <div style="text-align: center; margin: 28px 0;">
                                <a href="${joinLink.startsWith('http') ? joinLink : 'https://' + joinLink}" class="button" target="_blank">🚀 JOIN LIVE WEBINAR NOW</a>
                            </div>
                        ` : '<p>The direct join link will be activated closer to the event time.</p>'}

                        <p style="margin-top:28px;">If you have any questions, feel free to contact us at support@tgstechinfo.com.</p>
                        
                        <p style="margin-top:24px;margin-bottom:0;">Best regards,<br><strong>TGS Tech Info Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} TGS Tech Info. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        try {
            await sendEmail(attendeeEmail, `Webinar Confirmation: ${webinarTitle}`, emailHtml);
            console.log(`[registerWebinar] Confirmation email sent to ${attendeeEmail}`);
        } catch (emailErr) {
            console.warn('[registerWebinar] Email send skipped/failed:', emailErr.message);
        }

        res.json({
            success: true,
            message: 'Registration successful!',
            registration_id: result.insertId,
            join_link: webinar.join_link || null
        });
    } catch (error) {
        console.error('[registerWebinar] Error:', error);
        res.status(500).json({ message: 'Server error registering for webinar.' });
    }
};
