const Content = require('../models/Content');
const Category = require('../models/Category');
const ContentType = require('../models/ContentType');
const LandingPage = require('../models/LandingPage');
const DataRequest = require('../models/DataRequest');
const ContactSubmission = require('../models/ContactSubmission');
const Download = require('../models/Download');
const { pool } = require('../config/database');
const { sendEmail, accessGrantEmailTemplate, subscriptionEmailTemplate, renderCaseStudyEmail, sendTemplatedEmail, escapeHtml } = require('../config/email');
const axios = require('axios');
const { insertIntoDynamicTable, getDynamicTableSubmissions, sanitizeColumnName } = require('../utils/dynamicTable');
const fs = require('fs');
const path = require('path');

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

        if (process.env.NODE_ENV === 'production' && isPrivateOrLoopbackHost(parsedUrl.hostname)) {
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
        const isSuccess = response.status >= 200 && response.status < 300;
        if (!isSuccess) {
            console.error(`[Webhook] FAILED with status ${response.status} — ${normalizedUrl}`);
            console.error(`[Webhook] Response status: ${response.status} ${response.statusText}`);
            console.error(`[Webhook] Response data:`, JSON.stringify(response.data));
            return {
                success: false,
                status: response.status,
                data: response.data,
                error: typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
            };
        }

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
        const { category, content_type, limit = 10, offset = 0, start_date, end_date, sort_by } = req.query;
        const filters = { status: 'published', is_visible_on_site: true };

        if (sort_by) {
            filters.sort_by = String(sort_by).trim().toLowerCase();
        }

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
        const enrichedRows = rows.map(item => {
            const isFileLanding = Boolean(
                (item.builder_layout && typeof item.builder_layout === 'string' && item.builder_layout.includes('file-landing')) ||
                (item.content && typeof item.content === 'string' && item.content.includes('File-based landing page'))
            );
            if (isFileLanding) {
                return {
                    ...item,
                    is_file_landing_page: true,
                    url: `/lp/${item.slug}`
                };
            }
            return item;
        });
        res.json({ data: enrichedRows, total });
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
        let content = await Content.findBySlugAny(decodedSlug);

        // Fallback: Check if this corresponds to a file-based landing page in landing-pages/
        if (!content) {
            const { getOrCreateContentForLandingPage } = require('../utils/landingPageHelper');
            try {
                content = await getOrCreateContentForLandingPage(decodedSlug);
            } catch (e) {
                console.warn('[getContentBySlug] Landing page auto-provision warning:', e.message);
            }
        }

        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }

        // Public content must be published
        if (content.status !== 'published') {
            return res.status(404).json({ message: 'Content not found' });
        }

        // If scheduled for future, do not expose on public site
        if (content.scheduled_publish_date && new Date(content.scheduled_publish_date) > new Date()) {
            return res.status(404).json({ message: 'Content not found' });
        }

        const isFileLanding = Boolean(
            (content.builder_layout && typeof content.builder_layout === 'string' && content.builder_layout.includes('file-landing')) ||
            (content.content && typeof content.content === 'string' && content.content.includes('File-based landing page'))
        );
        if (isFileLanding) {
            content.is_file_landing_page = true;
            content.url = `/lp/${content.slug}`;
        }

        if (content.content_type_id === 5) {
            const [eventRows] = await pool.query(
                'SELECT id, title, slug, event_type, event_mode, start_date, end_date, timezone, venue_name, venue_address, venue_city, venue_map_url, source_url, registration_type, registration_url, online_platform, speaker_name, speaker_role, speaker_company, speaker_image, ticket_type, ticket_price, max_capacity, status, featured FROM events WHERE slug = ? OR title = ? LIMIT 1',
                [decodedSlug, content.title]
            );
            if (eventRows && eventRows.length > 0) {
                content.event = eventRows[0];
                content.source_url = eventRows[0].source_url;
                content.registration_type = eventRows[0].registration_type;
                content.registration_url = eventRows[0].registration_url;
            }
        }

        // Get related articles
        const relatedArticles = await Content.getRelatedArticles(content.id, content.category_id);
        const enrichedRelated = (relatedArticles || []).map(item => {
            const isRelFileLanding = Boolean(
                (item.builder_layout && typeof item.builder_layout === 'string' && item.builder_layout.includes('file-landing')) ||
                (item.content && typeof item.content === 'string' && item.content.includes('File-based landing page'))
            );
            if (isRelFileLanding) {
                return {
                    ...item,
                    is_file_landing_page: true,
                    url: `/lp/${item.slug}`
                };
            }
            return item;
        });

        res.json({ content, relatedArticles: enrichedRelated });
    } catch (error) {
        console.error('Get content by slug error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// In-memory cache for recent submissions to prevent duplicate double-submits within 3 seconds
const recentSubmissionsCache = new Map();

exports.submitLandingPage = async (req, res) => {
    try {
        console.log('========== FORM SUBMISSION START ==========');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('Headers:', JSON.stringify(req.headers, null, 2));

        const { content_id, extra_fields, ...rest } = req.body;

        let normalizedContentId = content_id ? Number(content_id) : null;
        if (normalizedContentId && Number.isNaN(normalizedContentId)) normalizedContentId = null;

        // Check if this submission is from a file-based landing page (/lp/:slug, landing_slug, or Referer /lp/:slug)
        let fileLandingSlug = req.body.landing_slug || req.body.landingSlug || req.query.landing_slug || req.query.slug || req.params.slug;
        if (!fileLandingSlug && extra_fields) {
            try {
                const parsedExtra = typeof extra_fields === 'string' ? JSON.parse(extra_fields) : extra_fields;
                fileLandingSlug = parsedExtra.landing_slug || parsedExtra.landingSlug;
            } catch (e) { }
        }
        if (!fileLandingSlug) {
            const referer = req.headers.referer || req.headers.referrer;
            if (referer) {
                try {
                    const url = new URL(referer);
                    const parts = url.pathname.split('/');
                    const lpIdx = parts.indexOf('lp');
                    if (lpIdx !== -1 && parts[lpIdx + 1]) {
                        fileLandingSlug = decodeURIComponent(parts[lpIdx + 1]);
                    }
                } catch (e) { }
            }
        }

        let content = null;

        // 1. If explicit content_id was provided, look up by ID first
        if (normalizedContentId) {
            content = await Content.findById(normalizedContentId);
            if (content) {
                console.log(`[submitLandingPage] Found content #${content.id} (${content.slug}) by explicit content_id`);
            }
        }

        // 2. If content not found by ID, and fileLandingSlug exists, find/create for landing slug
        if (!content && fileLandingSlug) {
            const { getOrCreateContentForLandingPage } = require('../utils/landingPageHelper');
            content = await getOrCreateContentForLandingPage(fileLandingSlug, req.body);
            if (content) {
                normalizedContentId = content.id;
                console.log(`[submitLandingPage] Auto-resolved content #${content.id} for landing slug '${fileLandingSlug}'`);
            }
        }

        // 3. Fallback: slug passed as a query param (?slug=my-page-slug)
        if (!content && !normalizedContentId && req.query.slug) {
            content = await Content.findBySlugAny(req.query.slug);
            if (content) normalizedContentId = content.id;
        }

        // 4. Fallback: parse slug from Referer URL path (/content/:slug)
        if (!content && !normalizedContentId) {
            const referer = req.headers.referer || req.headers.referrer;
            if (referer) {
                try {
                    const url = new URL(referer);
                    const pathParts = url.pathname.split('/');
                    const slugIndex = pathParts.indexOf('content');
                    if (slugIndex !== -1 && pathParts[slugIndex + 1]) {
                        const slug = pathParts[slugIndex + 1];
                        content = await Content.findBySlugAny(slug);
                        if (content) normalizedContentId = content.id;
                    }
                } catch (e) { }
            }
        }

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

        // Get extra data. Merge rest of root-level request body with extra_fields so both root fields and extra_fields are preserved
        let extraData = { ...rest };
        if (extra_fields) {
            const parsedExtra = typeof extra_fields === 'string' ? JSON.parse(extra_fields) : extra_fields;
            extraData = { ...extraData, ...parsedExtra };
        }

        // Normalize extraData keys to lowercase/sanitized form so lookup matches field name casing
        const normalizedExtraData = {};
        for (const [key, val] of Object.entries(extraData || {})) {
            normalizedExtraData[sanitizeColumnName(key)] = val;
        }

        // Find email field
        let submittedEmail = normalizedExtraData.email || normalizedExtraData.email_address || normalizedExtraData.work_email || extraData.email;
        const normalizedSubmittedEmail = String(submittedEmail || '').toLowerCase().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // ── Exemption check: Whitepaper, Webinar, and Event forms allow unlimited submissions ──────
        const exemptKeywords = [
            'whitepaper', 'white-paper', 'white_paper',
            'webinar',
            'event', 'events',
            'guide', 'comparison guide', 'comparison-guide',
            'ebook', 'e-book',
            'asset', 'download'
        ];

        const typeCandidates = [
            content?.content_type,
            content?.content_type_name,
            content?.category_slug,
            content?.category_name,
            content?.title,
            req.body?.content_type,
            req.body?.asset_type,
            req.body?.form_type,
            req.body?.lead_type,
            req.body?.type,
            req.body?.category,
            req.body?.landing_slug,
            extraData?.content_type,
            extraData?.asset_type,
            extraData?.form_type,
            extraData?.lead_type,
            extraData?.type,
            extraData?.category,
            extraData?.asset,
            fileLandingSlug
        ];

        const isExemptFromDuplicateCheck = typeCandidates.some(candidate => {
            if (!candidate || typeof candidate !== 'string') return false;
            const lower = candidate.toLowerCase();
            return exemptKeywords.some(kw => lower.includes(kw));
        });

        if (isExemptFromDuplicateCheck) {
            console.log(`[submitLandingPage] Exempt content type detected (whitepaper/webinar/event). Multiple submissions allowed for email: '${normalizedSubmittedEmail}'`);
        }

        // ── Check if this email has already subscribed / submitted FIRST ───────────────
        // Only enforce duplicate restriction for non-exempt forms (Contact, Newsletter, Registration, general subscriptions)
        if (normalizedSubmittedEmail && !isExemptFromDuplicateCheck) {
            if (!emailRegex.test(normalizedSubmittedEmail)) {
                return res.status(400).json({ message: 'Invalid email address format' });
            }

            let alreadySubmitted = false;

            // 1. Check for specific content ID in LandingPage and dynamic table
            if (normalizedContentId) {
                const existing = await LandingPage.findByEmailAndContent(normalizedSubmittedEmail, normalizedContentId);
                if (existing) {
                    alreadySubmitted = true;
                } else {
                    try {
                        const [dynRows] = await pool.query(
                            `SELECT id FROM form_submissions_${normalizedContentId} WHERE LOWER(email) = ? LIMIT 1`,
                            [normalizedSubmittedEmail]
                        );
                        if (dynRows && dynRows.length > 0) alreadySubmitted = true;
                    } catch (e) { /* dynamic table may not exist yet */ }
                }
            }

            // 2. Check across all landing page submissions (and file-based landings)
            if (!alreadySubmitted) {
                const lpExisting = await LandingPage.findByEmail(normalizedSubmittedEmail);
                if (lpExisting) alreadySubmitted = true;
            }

            // 3. Check active newsletter subscribers
            if (!alreadySubmitted) {
                try {
                    const [newsRows] = await pool.query(
                        'SELECT id FROM newsletter_subscribers WHERE email = ? AND is_active = 1 LIMIT 1',
                        [normalizedSubmittedEmail]
                    );
                    if (newsRows && newsRows.length > 0) alreadySubmitted = true;
                } catch (e) { /* table might be empty/error */ }
            }

            if (alreadySubmitted) {
                console.log(`[submitLandingPage] Email '${normalizedSubmittedEmail}' has already submitted/subscribed. Blocking duplicate.`);
                
                const contentType = req.headers['content-type'] || '';
                const acceptHeader = req.headers.accept || '';
                const isFormPost = contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data');
                const isAjax = Boolean(req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest' || (acceptHeader.includes('application/json') && !acceptHeader.includes('text/html')) || contentType.includes('application/json'));

                if (isFormPost && !isAjax) {
                    const referer = req.headers.referer || req.headers.referrer || '/';
                    return res.status(409).send(`
                        <!DOCTYPE html>
                        <html>
                        <head><meta charset="utf-8"><title>Notice</title></head>
                        <body style="font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc;">
                          <script>
                            alert("This email has been already subscribed");
                            if (window.history.length > 1) {
                              window.history.back();
                            } else {
                              window.location.href = ${JSON.stringify(referer)};
                            }
                          </script>
                          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; max-width: 400px;">
                            <h3 style="color: #dc2626; margin-top: 0;">Notice</h3>
                            <p style="color: #4b5563; font-size: 16px;">This email has been already subscribed.</p>
                            <a href="javascript:history.back()" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">Go Back</a>
                          </div>
                        </body>
                        </html>
                    `);
                }

                return res.status(409).json({
                    success: false,
                    alreadySubscribed: true,
                    already_submitted: true,
                    message: 'This email has been already subscribed'
                });
            }
        }

        // Validate required fields — only for standard CMS pages when customFieldsDef has entries
        // HTML file-based landing pages have their own form structure and client-side validation
        if (!fileLandingSlug && customFieldsDef.length > 0) {
            for (const field of customFieldsDef) {
                const val = normalizedExtraData[field.name] ?? '';
                if (field.required !== false && String(val).trim() === '') {
                    return res.status(400).json({ message: `Field "${field.label || field.name}" is required` });
                }
            }
        }

        // Enforce required email for standard submissions if it's missing (unless customFieldsDef makes it optional)
        if (!submittedEmail && fileLandingSlug) {
            return res.status(400).json({ message: 'Email address is required' });
        }

        // For file-based landing pages, enforce at least a name
        if (fileLandingSlug) {
            const hasName = normalizedExtraData.first_name || normalizedExtraData.last_name || normalizedExtraData.name || normalizedExtraData.full_name;
            if (!hasName) {
                return res.status(400).json({ message: 'Name is required' });
            }
        }

        // ── Prevent Duplicate Rapid Submissions (within 3 seconds) ──────────────────
        const dedupeKey = `${normalizedContentId || fileLandingSlug}:${normalizedSubmittedEmail}`;
        const lastSubmitTime = recentSubmissionsCache.get(dedupeKey);
        const now = Date.now();
        if (lastSubmitTime && (now - lastSubmitTime) < 3000) {
            console.log(`[submitLandingPage] Rapid duplicate submission detected for '${dedupeKey}' within 3 seconds.`);
            return res.status(409).json({
                success: false,
                alreadySubscribed: true,
                message: 'This email has been already subscribed'
            });
        }
        recentSubmissionsCache.set(dedupeKey, now);

        // ── Store Form Submission in Database ─────────────────────────────────────
        // 1. Order keys so primary lead contact info appears first in database JSON previews
        const priorityKeys = [
            'first_name',
            'last_name',
            'contact',
            'phone',
            'phone_number',
            'email',
            'email_address',
            'company',
            'company_name',
            'employee_size',
            'industry',
            'job_title',
            'country'
        ];

        const orderedLeadData = {};
        for (const pk of priorityKeys) {
            if (normalizedExtraData[pk] !== undefined && normalizedExtraData[pk] !== '') {
                orderedLeadData[pk] = normalizedExtraData[pk];
            }
        }
        // Ensure contact key is present if phone exists
        if (!orderedLeadData.contact && (orderedLeadData.phone || orderedLeadData.phone_number)) {
            orderedLeadData.contact = orderedLeadData.phone || orderedLeadData.phone_number;
        }

        // Remaining submitted fields
        for (const [k, v] of Object.entries(normalizedExtraData)) {
            if (!priorityKeys.includes(k) && k !== 'session_uuid' && k !== 'consent_uuid' && k !== 'ip_address' && k !== 'user_agent') {
                orderedLeadData[k] = v;
            }
        }
        // Metadata fields placed at the end
        if (normalizedExtraData.session_uuid) orderedLeadData.session_uuid = normalizedExtraData.session_uuid;
        if (normalizedExtraData.consent_uuid) orderedLeadData.consent_uuid = normalizedExtraData.consent_uuid;
        orderedLeadData.ip_address = req.ip;
        orderedLeadData.user_agent = req.headers['user-agent'];

        const leadDataWithMeta = orderedLeadData;

        let submissionRecord = null;
        if (normalizedContentId) {
            // 1. Always insert into the dedicated dynamic table (e.g. form_submissions_459)
            try {
                await insertIntoDynamicTable(normalizedContentId, leadDataWithMeta);
                console.log(`✅ Successfully inserted into dynamic table form_submissions_${normalizedContentId}`);
            } catch (dynamicTableError) {
                console.error(`❌ Dynamic table insert failed for form_submissions_${normalizedContentId}:`, dynamicTableError.message);
            }

            // 2. Always ALSO insert into landing_page_submissions so it shows in Admin Panel and unified submissions
            try {
                submissionRecord = await LandingPage.create({
                    content_id: normalizedContentId,
                    extra_fields: leadDataWithMeta
                });
                console.log(`✅ Successfully recorded submission into landing_page_submissions for content ${normalizedContentId}`);
            } catch (lpErr) {
                console.warn(`[LandingPage.create] Note:`, lpErr.message);
            }
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

        // Fallback 2: Extract webhook URL directly from the form submission body (common in HTML Builder)
        if (extraData.webhook_url || extraData.apiUrl || req.body.webhook_url || req.body.apiUrl) {
            const explicitWebhook = (extraData.webhook_url || extraData.apiUrl || req.body.webhook_url || req.body.apiUrl).trim();
            if (explicitWebhook) {
                targetWebhookUrl = explicitWebhook;
                console.log('[submitLandingPage] Fallback 2: Extracted webhook_url from form submission:', targetWebhookUrl);
                
                // Update the content record so it's persisted for next time
                if (normalizedContentId) {
                    pool.query('UPDATE contents SET webhook_url = ? WHERE id = ?', [targetWebhookUrl, normalizedContentId]).catch(err => console.error('[submitLandingPage] Failed to save form-submitted webhook_url:', err.message));
                }
            }
        }

        let webhookResult = null;
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
                ['first_name', 'name'],
                // Add aliases for Software Advice & other client CRM endpoints:
                ['first_name', 'f_name'],
                ['firstName', 'f_name'],
                ['last_name', 'l_name'],
                ['lastName', 'l_name'],
                ['lead_type', 'type'],
                ['partner_source', 'utm_source']
            ];

            for (const [snake, camel] of keyAliases) {
                if (webhookPayload[snake] !== undefined && webhookPayload[camel] === undefined) {
                    webhookPayload[camel] = webhookPayload[snake];
                } else if (webhookPayload[camel] !== undefined && webhookPayload[snake] === undefined) {
                    webhookPayload[snake] = webhookPayload[camel];
                }
            }

            // Software Advice / Gartner partner-conversion specific requirements
            if (targetWebhookUrl.includes('softwareadvice.com') || targetWebhookUrl.includes('partner-conversion')) {
                // Remove internal nested objects and non-client metadata to keep payload clean for CRM ingest
                delete webhookPayload.extra_fields;
                delete webhookPayload.content_id;
                delete webhookPayload.session_uuid;
                delete webhookPayload.consent_uuid;
                delete webhookPayload.webhook_url;
                delete webhookPayload.page_url;
                delete webhookPayload.redirect_url;

                const fn = (webhookPayload.first_name || webhookPayload.firstName || webhookPayload.f_name || webhookPayload.name || '').trim();
                const ln = (webhookPayload.last_name || webhookPayload.lastName || webhookPayload.l_name || '').trim();

                webhookPayload.f_name = fn;
                webhookPayload.l_name = ln;
                if (!webhookPayload.first_name) webhookPayload.first_name = fn;
                if (!webhookPayload.last_name) webhookPayload.last_name = ln;

                if (!webhookPayload.type || String(webhookPayload.type).trim() === '') {
                    webhookPayload.type = webhookPayload.lead_type || 'download';
                }
                if (!webhookPayload.utm_source || String(webhookPayload.utm_source).trim() === '') {
                    webhookPayload.utm_source = webhookPayload.partner_source || 'tgst';
                }
                if (!webhookPayload.partner_source || String(webhookPayload.partner_source).trim() === '') {
                    webhookPayload.partner_source = 'tgst';
                }
                if (!webhookPayload.market_id || String(webhookPayload.market_id).trim() === '') {
                    webhookPayload.market_id = '13';
                }
                if (!webhookPayload.size_id || String(webhookPayload.size_id).trim() === '') {
                    webhookPayload.size_id = '896';
                }
                if (!webhookPayload.segment_id || String(webhookPayload.segment_id).trim() === '') {
                    webhookPayload.segment_id = '441';
                }
                if (!webhookPayload.asset || String(webhookPayload.asset).trim() === '') {
                    webhookPayload.asset = 'hr-comparison-guide-adp-workforce-now-vs-paylocity-vs-paycor-2025';
                }
                if (!webhookPayload.campaign || String(webhookPayload.campaign).trim() === '') {
                    webhookPayload.campaign = 'HR';
                }
                if (!webhookPayload.lead_source || String(webhookPayload.lead_source).trim() === '') {
                    webhookPayload.lead_source = 'Software Advice';
                }
                if (webhookPayload.optin === undefined || webhookPayload.optin === null || webhookPayload.optin === '') {
                    webhookPayload.optin = 1;
                }
                if (webhookPayload.gdpr_consent === undefined || webhookPayload.gdpr_consent === null || webhookPayload.gdpr_consent === '') {
                    webhookPayload.gdpr_consent = 1;
                }
                if (!webhookPayload.api_key) {
                    webhookPayload.api_key = '944ab8222f7331f9a8efe3d0736837dc5bf6210f';
                }
                if (!webhookPayload.partner_api_key) {
                    webhookPayload.partner_api_key = '944ab8222f7331f9a8efe3d0736837dc5bf6210f';
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
            try {
                webhookResult = await forwardToWebhook(targetWebhookUrl, webhookPayload);
                if (webhookResult && !webhookResult.success) {
                    console.error(`[Webhook] Client endpoint returned failure (${webhookResult.status}):`, webhookResult.error);
                    pool.query(
                        'INSERT INTO webhook_failures (content_id, webhook_url, payload, error_message) VALUES (?, ?, ?, ?)',
                        [normalizedContentId, targetWebhookUrl, JSON.stringify(webhookPayload), `HTTP ${webhookResult.status}: ${JSON.stringify(webhookResult.data)}`]
                    ).catch(dbErr => console.error('[Webhook] Failed to log webhook failure:', dbErr.message));
                } else {
                    console.log(`[Webhook] Successfully forwarded to client URL (${targetWebhookUrl}) - Status:`, webhookResult?.status);
                }
            } catch (err) {
                console.error('[Webhook] Failed to forward to client URL:', err.message);
                webhookResult = { success: false, status: 500, error: err.message };
                pool.query(
                    'INSERT INTO webhook_failures (content_id, webhook_url, payload, error_message) VALUES (?, ?, ?, ?)',
                    [normalizedContentId, targetWebhookUrl, JSON.stringify(webhookPayload), err.message]
                ).catch(dbErr => console.error('[Webhook] Failed to log webhook failure:', dbErr.message));
            }
        } else {
            console.log('[Webhook] No webhook URL configured or found for content:', normalizedContentId);
        }

        // Find name/email for email template
        const emailField = customFieldsDef.find(f => f.type === 'email' || f.name === 'email' || (f.webhook_key || '').toLowerCase().includes('email'));
        const emailValue =
            (emailField && (normalizedExtraData[emailField.name] || extraData[emailField.name])) ||
            normalizedExtraData.email ||
            normalizedExtraData.email_address ||
            normalizedExtraData.work_email ||
            extraData.email ||
            extraData.email_address ||
            extraData.work_email ||
            req.body.email ||
            null;

        const nameField = customFieldsDef.find(f => f.name === 'first_name' || f.name === 'name' || (f.webhook_key || '').toLowerCase().includes('name'));
        const fullName =
            (nameField && (normalizedExtraData[nameField.name] || extraData[nameField.name])) ||
            normalizedExtraData.first_name ||
            normalizedExtraData.name ||
            normalizedExtraData.full_name ||
            extraData.first_name ||
            extraData.name ||
            extraData.full_name ||
            req.body.first_name ||
            'there';
        const typeSlug = (content?.content_type || '').toLowerCase();
        const typeName = (content?.content_type_name || '').toLowerCase();
        const isEbook = typeSlug.includes('ebook') || typeName.includes('ebook') || content?.content_type_id === 7;

        // Build direct download URL if pdf_file exists
        let downloadUrl = null;
        if (content?.pdf_file) {
            const rawPdf = String(content.pdf_file).trim();
            if (rawPdf.startsWith('http://') || rawPdf.startsWith('https://')) {
                downloadUrl = rawPdf;
            } else {
                const baseUrl = (process.env.BACKEND_URL || process.env.API_URL || 'https://tgstechinfo.com').replace(/\/+$/, '');
                const cleanPdf = rawPdf.startsWith('/') ? rawPdf : `/uploads/${rawPdf}`;
                downloadUrl = `${baseUrl}${cleanPdf}`;
            }
        }

        const contentTitle = content?.title || (isEbook ? 'Your eBook' : 'the requested article');
        const emailSubject = isEbook
            ? `Your eBook Download: ${contentTitle} — TGS Tech Info`
            : `Access Granted: ${contentTitle} — TGS Tech Info`;

        if (emailValue) {
            try {
                const emailHtml = accessGrantEmailTemplate(fullName, contentTitle, downloadUrl, isEbook);
                const emailResult = await sendEmail(emailValue, emailSubject, emailHtml);
                if (!emailResult?.success) {
                    console.error('[submitLandingPage] Email delivery failed:', emailResult?.error || emailResult?.reason);
                } else {
                    console.log(`[submitLandingPage] Email successfully sent to ${emailValue}`);
                }
            } catch (emailError) {
                console.error('[submitLandingPage] Email send exception:', emailError.message);
            }
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

        // Determine if request is an AJAX/fetch call or standard browser form navigation
        const contentType = req.headers['content-type'] || '';
        const acceptHeader = req.headers.accept || '';
        const isJson = (typeof req.is === 'function' ? req.is('json') : false) || contentType.includes('application/json');
        const isFormPost = contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data');

        const isAjaxOrFetch = !isFormPost && Boolean(
            req.xhr ||
            req.headers['x-requested-with'] === 'XMLHttpRequest' ||
            (acceptHeader.includes('application/json') && !acceptHeader.includes('text/html')) ||
            isJson
        );

        const isBrowserNavigation = isFormPost ||
            req.headers['sec-fetch-mode'] === 'navigate' ||
            req.headers['sec-fetch-dest'] === 'document' ||
            (acceptHeader.includes('text/html') && !isAjaxOrFetch);

        if (isBrowserNavigation || !isAjaxOrFetch) {
            if (redirectUrl) {
                console.log('[submitLandingPage] Browser form navigation detected: redirecting to', redirectUrl);
                return res.redirect(302, redirectUrl);
            }
            const referer = req.headers.referer || req.headers.referrer;
            if (referer) {
                return res.redirect(302, `${referer}${referer.includes('?') ? '&' : '?'}submitted=true`);
            }
        }

        res.json({
            id: submissionRecord?.id || normalizedContentId || 1,
            submission_id: submissionRecord?.id || null,
            message: isEbook ? 'Thank you! The eBook download link has been sent to your email.' : 'Access granted successfully.',
            has_access: true,
            pdf_file: content?.pdf_file || null,
            download_url: downloadUrl || null,
            redirect_url: redirectUrl || null,
            webhook_success: webhookResult ? webhookResult.success : null,
            webhook_status: webhookResult ? webhookResult.status : null,
            webhook_data: webhookResult ? webhookResult.data : null,
            webhook_error: webhookResult && !webhookResult.success ? (webhookResult.error || webhookResult.data) : null
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
            } catch { }
        }

        const emailField = customFieldsDef.find(f => f.type === 'email' || f.name === 'email' || (f.webhook_key || '').toLowerCase() === 'email');
        const emailValue = emailField ? extraData[emailField.name] : null;
        const nameField = customFieldsDef.find(f => f.name === 'first_name' || f.name === 'name' || (f.webhook_key || '').toLowerCase().includes('name'));
        const fullName = nameField ? (extraData[nameField.name] || 'there') : 'there';
        const contentTitle = content?.title || 'the requested content';

        const isContentExempt = ['whitepaper', 'webinar', 'event', 'guide', 'ebook'].some(kw => 
            (content?.content_type || content?.content_type_name || content?.category_slug || '').toLowerCase().includes(kw)
        );

        const existing = (!isContentExempt && emailValue) ? await LandingPage.findByEmailAndContent(emailValue, Number(content_id)) : null;
        if (existing) {
            return res.status(409).json({
                success: false,
                alreadySubscribed: true,
                message: 'This email has been already subscribed'
            });
        }

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
        const { email, name } = req.body;
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({ message: 'Valid email is required' });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const cleanName = (typeof name === 'string' && name.trim()) ? name.trim().replace(/\s+/g, ' ') : '';

        // Determine polite human-friendly greeting:
        // If user entered a name (e.g. "Manisha" or "Manisha Sharma"), capitalize and use it.
        // If not provided, use "there" (renders "Hi there,") - NEVER raw email usernames like "Hi manisha6698sb,"!
        let greetingName = 'there';
        if (cleanName) {
            greetingName = cleanName.split(' ')
                .filter(Boolean)
                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(' ');
        }

        // Check if already subscribed
        const [existing] = await pool.query(
            'SELECT * FROM newsletter_subscribers WHERE email = ?',
            [normalizedEmail]
        );

        const crypto = require('crypto');
        const rawFrontend = process.env.SITE_URL || process.env.FRONTEND_URL || 'https://tgstechinfo.com';
        const frontendUrl = rawFrontend.split(',')[0].trim().replace(/\/$/, '');

        if (existing.length > 0) {
            const subscriber = existing[0];
            if (subscriber.is_active) {
                return res.status(409).json({
                    success: false,
                    alreadySubscribed: true,
                    message: 'This email has been already subscribed'
                });
            }

            // Inactive subscriber -> re-subscribe
            const unsubscribeToken = crypto.randomBytes(32).toString('hex');
            await pool.query(
                'UPDATE newsletter_subscribers SET is_active = 1, unsubscribed_at = NULL, unsubscribe_reason = NULL, name = COALESCE(?, name), unsubscribe_token = ? WHERE id = ?',
                [cleanName || null, unsubscribeToken, subscriber.id]
            );

            const effectiveName = greetingName !== 'there' ? greetingName : (subscriber.name || 'there');
            const unsubscribeUrl = `${frontendUrl}/unsubscribe?token=${unsubscribeToken}&email=${encodeURIComponent(normalizedEmail)}`;

            try {
                await sendTemplatedEmail('newsletter_subscription', normalizedEmail, {
                    name: effectiveName,
                    first_name: effectiveName,
                    site_url: frontendUrl,
                    unsubscribe_url: unsubscribeUrl
                });
            } catch (emailError) {
                console.warn('Newsletter re-subscription confirmation email failed:', emailError.message);
            }

            return res.json({ message: 'Subscribed to newsletter successfully' });
        }

        // Also check if previously submitted on landing page
        const lpExisting = await LandingPage.findByEmail(normalizedEmail);
        if (lpExisting) {
            return res.status(409).json({
                success: false,
                alreadySubscribed: true,
                message: 'This email has been already subscribed'
            });
        }

        // New subscriber
        const unsubscribeToken = crypto.randomBytes(32).toString('hex');

        await pool.query(
            'INSERT INTO newsletter_subscribers (email, name, unsubscribe_token) VALUES (?, ?, ?)',
            [normalizedEmail, cleanName || null, unsubscribeToken]
        );

        const unsubscribeUrl = `${frontendUrl}/unsubscribe?token=${unsubscribeToken}&email=${encodeURIComponent(normalizedEmail)}`;

        // Send confirmation email (with database template and robust fallback)
        try {
            let emailResult = null;
            try {
                emailResult = await sendTemplatedEmail('newsletter_subscription', normalizedEmail, {
                    name: greetingName,
                    first_name: greetingName,
                    site_url: frontendUrl,
                    unsubscribe_url: unsubscribeUrl
                });
            } catch (tplErr) {
                console.warn('[subscribeNewsletter] sendTemplatedEmail failed, trying direct fallback:', tplErr.message);
            }

            // Fallback to direct sendEmail if template missing, inactive, or skipped
            if (!emailResult || !emailResult.success) {
                const logoUrl = `${frontendUrl}/uploads/branding/logo.png`;
                const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to TGS Tech Info Newsletter</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
    <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #0B1F4D 0%, #1a237e 100%); padding: 28px 24px; text-align: center;">
            <img src="${logoUrl}" alt="TGS Tech Info" style="max-width: 160px; height: auto; margin-bottom: 12px;" />
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">Welcome to Our Newsletter</h1>
        </div>
        <div style="padding: 32px 28px;">
            <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">Hi <strong>${escapeHtml(greetingName)}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                Thank you for subscribing to our newsletter! You will now receive the latest technology insights, industry trends, and in-depth analysis directly in your inbox.
            </p>
            <div style="background-color: #f1f5f9; border-left: 4px solid #F7941D; padding: 16px 20px; border-radius: 6px; margin: 24px 0;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;"><strong>What you can look forward to:</strong></p>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #1e293b; line-height: 1.8;">
                    <li>Latest technology trends and market shifts</li>
                    <li>Exclusive industry whitepapers and case studies</li>
                    <li>Early access to expert guides and software comparisons</li>
                    <li>Thought leadership from leading tech professionals</li>
                </ul>
            </div>
            <div style="text-align: center; margin: 28px 0;">
                <a href="${frontendUrl}" style="display: inline-block; padding: 12px 28px; background-color: #F7941D; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Explore Our Website</a>
            </div>
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                You are receiving this email because you subscribed on tgstechinfo.com.<br />
                To unsubscribe at any time, <a href="${unsubscribeUrl}" style="color: #0284c7; text-decoration: underline;">click here</a>.
            </p>
        </div>
        <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            © ${new Date().getFullYear()} TGS Tech Info. All rights reserved.
        </div>
    </div>
</body>
</html>`;
                emailResult = await sendEmail(normalizedEmail, 'Welcome to TGS Tech Info Newsletter!', fallbackHtml);
            }

            if (emailResult?.success) {
                console.log(`[subscribeNewsletter] Confirmation email successfully sent to ${normalizedEmail}`);
            } else {
                console.warn(`[subscribeNewsletter] Confirmation email skipped/failed:`, emailResult?.error || emailResult?.reason);
            }
        } catch (emailError) {
            console.warn('[subscribeNewsletter] Newsletter confirmation email failed:', emailError.message);
        }

        res.json({ message: 'Subscribed to newsletter successfully' });
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.unsubscribeNewsletter = async (req, res) => {
    try {
        const token = req.query.token || req.body?.token;
        const email = req.query.email || req.body?.email;
        const reason = req.body?.reason || req.query?.reason || null;
        const isVerifyOnly = req.query.verify === '1' || req.query.checkOnly === '1';

        if (!token && !email) {
            return res.status(400).json({ message: 'Unsubscribe token or email address is required' });
        }

        let subscriber = null;

        if (token) {
            const [subscribers] = await pool.query(
                'SELECT * FROM newsletter_subscribers WHERE unsubscribe_token = ?',
                [token]
            );
            if (subscribers.length > 0) {
                subscriber = subscribers[0];
            }
        } else if (email) {
            const normalizedEmail = email.trim().toLowerCase();
            const [subscribers] = await pool.query(
                'SELECT * FROM newsletter_subscribers WHERE LOWER(email) = ?',
                [normalizedEmail]
            );
            if (subscribers.length > 0) {
                subscriber = subscribers[0];
            }
        }

        if (!subscriber) {
            return res.status(404).json({ message: 'No active newsletter subscription found for this link or email address' });
        }

        // Token verification / read-only check (does not alter subscription)
        if (isVerifyOnly) {
            return res.json({
                valid: true,
                email: subscriber.email,
                name: subscriber.name || '',
                is_active: subscriber.is_active
            });
        }

        // Idempotent UX: if already inactive, return a graceful success response
        if (!subscriber.is_active) {
            return res.json({
                message: 'You are already unsubscribed from our newsletter.',
                already_unsubscribed: true,
                email: subscriber.email
            });
        }

        // Clean reason feedback
        const cleanReason = (typeof reason === 'string' && reason.trim()) ? reason.trim().slice(0, 1000) : null;

        // Mark as unsubscribed and save reason
        await pool.query(
            'UPDATE newsletter_subscribers SET is_active = 0, unsubscribed_at = NOW(), unsubscribe_reason = ? WHERE id = ?',
            [cleanReason, subscriber.id]
        );

        res.json({
            message: 'Successfully unsubscribed from newsletter',
            email: subscriber.email,
            reason: cleanReason
        });
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

exports.getContentTypesWithCount = async (req, res) => {
    try {
        const { category } = req.query;
        const { pool } = require('../config/database');

        let categoryFilter = '';
        const values = [];

        if (category) {
            const matchedCategory = await Category.findBySlug(category);
            if (matchedCategory) {
                categoryFilter = ' AND c.category_id = ?';
                values.push(matchedCategory.id);
            }
        }

        const [rows] = await pool.query(
            `SELECT ct.id, ct.name, ct.slug, COUNT(c.id) as count
             FROM content_types ct
             LEFT JOIN contents c ON c.content_type_id = ct.id 
                  AND (c.status = 'published' OR c.status IS NULL)
                  AND (c.is_visible_on_site = 1 OR c.is_visible_on_site IS NULL)
                  ${categoryFilter}
             GROUP BY ct.id, ct.name, ct.slug
             ORDER BY ct.id ASC`,
            values
        );

        const result = rows.map(r => ({
            id: r.id,
            name: r.name,
            slug: r.slug,
            count: parseInt(r.count || 0, 10)
        }));

        res.json(result);
    } catch (error) {
        console.error('Get content types with count error:', error);
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
        const [[{ totalUsers }]] = await pool.query("SELECT COUNT(*) as totalUsers FROM users");
        const [[{ totalViews }]] = await pool.query('SELECT COALESCE(SUM(view_count),0) as totalViews FROM contents');
        res.json({
            totalPublished,
            totalArticles: totalPublished,
            totalCategories,
            totalAuthors,
            totalUsers,
            totalExperts: totalAuthors > 0 ? totalAuthors : totalUsers,
            totalViews
        });
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
            const safeFirstName = escapeHtml(first_name);
            const safeDsarType = escapeHtml(dsar_type);
            await sendEmail(
                email,
                'Data Request Received — TGS Tech Info',
                `<p>Dear ${safeFirstName},</p>
                 <p>We have received your data subject request (ID: <strong>#${record.id}</strong>).</p>
                 <p><strong>Request Type:</strong> ${safeDsarType}</p>
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
            const safeFirstName = escapeHtml(firstName);
            const safeDnsType = escapeHtml(dns_type);
            await sendEmail(
                email,
                'Opt-Out Request Received — TGS Tech Info',
                `<p>Dear ${safeFirstName},</p>
                 <p>We have received your opt-out request (ID: <strong>#${record.id}</strong>).</p>
                 <p><strong>Request Type:</strong> ${safeDnsType}</p>
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

        // Check if this email has already submitted contact form
        const [existingContact] = await pool.query(
            'SELECT id FROM contact_submissions WHERE LOWER(email) = ? LIMIT 1',
            [email.toLowerCase().trim()]
        );
        if (existingContact && existingContact.length > 0) {
            console.log(`[submitContact] Email '${email}' has already submitted contact form. Blocking duplicate.`);
            return res.status(409).json({
                success: false,
                alreadySubscribed: true,
                message: 'This email has been already subscribed'
            });
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

        // Escape inputs for safe HTML email rendering
        const safeFullName = escapeHtml(full_name);
        const safeEmail = escapeHtml(email);
        const safeCompany = escapeHtml(company || 'N/A');
        const safeCategory = escapeHtml(inquiry_category);
        const safeSubject = escapeHtml(subject);
        const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

        const rawFrontend = process.env.SITE_URL || process.env.FRONTEND_URL || 'https://tgstechinfo.com';
        const frontendUrl = rawFrontend.split(',')[0].trim().replace(/\/$/, '');
        const logoUrl = `${frontendUrl}/uploads/branding/logo.png`;

        // Send confirmation email to user (transactional)
        try {
            const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inquiry Received — TGS Tech Info</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
    <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #0B1F4D 0%, #1a237e 100%); padding: 28px 24px; text-align: center;">
            <img src="${logoUrl}" alt="TGS Tech Info" style="max-width: 160px; height: auto; margin-bottom: 12px;" />
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">Thank You for Contacting Us</h1>
        </div>
        <div style="padding: 32px 28px;">
            <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">Dear <strong>${safeFullName}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                We have received your message and our team is already reviewing your inquiry. You can expect a response from one of our specialists within <strong>24 to 48 business hours</strong>.
            </p>
            <div style="background-color: #f1f5f9; border-left: 4px solid #F7941D; padding: 16px 20px; border-radius: 6px; margin: 24px 0;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;"><strong>Submission Details:</strong></p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Subject:</strong> ${safeSubject}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Category:</strong> ${safeCategory}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Company:</strong> ${safeCompany}</p>
            </div>
            <p style="font-size: 13px; color: #64748b; line-height: 1.6;">
                If your inquiry is urgent, please reply directly to this email or reach us at <a href="mailto:info@tgstechinfo.com" style="color: #0284c7; text-decoration: underline;">info@tgstechinfo.com</a>.
            </p>
            <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #0f172a;">Editorial & Support Team</p>
                <p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">TGS Tech Info — <a href="${frontendUrl}" style="color: #0284c7; text-decoration: none;">tgstechinfo.com</a></p>
            </div>
        </div>
        <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            © ${new Date().getFullYear()} TGS Tech Info. All rights reserved.
        </div>
    </div>
</body>
</html>`;
            await sendEmail(email, `Inquiry Received: ${subject} — TGS Tech Info`, emailHtml, { isTransactional: true });
        } catch (e) {
            console.warn('[submitContact] Contact confirmation email failed:', e.message);
        }

        // Send notification email to admin(s) (transactional)
        try {
            const adminEmailHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>New Contact Form Submission</title></head>
<body style="font-family: Arial, sans-serif; background: #f8fafc; padding: 20px; color: #1e293b;">
    <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <h2 style="color: #0f2044; margin-top: 0;">New Contact Form Submission</h2>
        <p><strong>From:</strong> ${safeFullName} (&lt;${safeEmail}&gt;)</p>
        <p><strong>Company:</strong> ${safeCompany}</p>
        <p><strong>Category:</strong> ${safeCategory}</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <p><strong>Message:</strong></p>
        <div style="background: #f1f5f9; padding: 16px; border-radius: 6px; border-left: 4px solid #0284c7; font-size: 14px; line-height: 1.6;">${safeMessage}</div>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;" />
        <p style="font-size: 12px; color: #64748b; margin: 0;">Sent automatically from TGS Tech Info Publishing Platform.</p>
    </div>
</body>
</html>`;
            const adminEmailsConfig = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || 'info@tgstechinfo.com';
            const adminRecipients = adminEmailsConfig.split(',').map(e => e.trim()).filter(Boolean);
            for (const adminTo of adminRecipients) {
                await sendEmail(adminTo, `[Inquiry Alert] ${safeFullName}: ${subject}`, adminEmailHtml, { isTransactional: true });
            }
        } catch (e) {
            console.warn('[submitContact] Admin notification email failed:', e.message);
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

        const { getNowInIST } = require('../utils/dateHelper');
        const registeredAt = getNowInIST();
        const [result] = await pool.query(
            `INSERT INTO webinar_registrations 
            (webinar_id, first_name, last_name, email, job_title, company_name, contact_number, registered_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                first_name.trim(),
                last_name.trim(),
                email.trim().toLowerCase(),
                job_title ? job_title.trim() : null,
                company_name ? company_name.trim() : null,
                contact_number ? contact_number.trim() : null,
                registeredAt
            ]
        );

        console.log(`[registerWebinar] Registration saved with ID ${result.insertId} for webinar ${id}`);

        // Send webinar registration confirmation email
        const attendeeEmail = email.trim().toLowerCase();
        const webinarTitle = escapeHtml(webinar.title || 'Webinar');
        const joinLink = webinar.join_link || '';
        const webinarDateStr = webinar.webinar_date ? new Date(webinar.webinar_date).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' }) : 'Scheduled Date & Time';
        const safeFirstName = escapeHtml(first_name.trim());
        const safeHostedBy = webinar.hosted_by ? escapeHtml(webinar.hosted_by) : '';
        const safePlatform = webinar.platform ? escapeHtml(webinar.platform) : '';

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
                        <h3 style="color:#0f172a;margin-top:0;">Hi ${safeFirstName},</h3>
                        <p>Thank you for registering! Your complimentary virtual pass for our live technical webinar has been reserved.</p>
                        
                        <div class="info-box">
                            <h4 style="margin:0 0 12px;color:#0f172a;font-size:16px;">${webinarTitle}</h4>
                            <p style="margin:6px 0;font-size:14px;"><strong>📅 Date & Time:</strong> ${webinarDateStr}</p>
                            ${safeHostedBy ? `<p style="margin:6px 0;font-size:14px;"><strong>👤 Hosted By:</strong> ${safeHostedBy}</p>` : ''}
                            ${safePlatform ? `<p style="margin:6px 0;font-size:14px;"><strong>💻 Platform:</strong> ${safePlatform}</p>` : ''}
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
