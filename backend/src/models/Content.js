const { pool } = require('../config/database');
const slugify = require('slugify');
const { createDynamicTable, updateDynamicTable, dropDynamicTable } = require('../utils/dynamicTable');

/**
 * Automatically process HTML builder content on save:
 *  1. Detect any API_URL the client wrote in the inline <script>
 *  2. Save it as the webhook_url (fixing backslash escapes)
 *  3. Rewrite the HTML so the form submits to /api/public/landing-page
 *  4. Parse all <input>/<select>/<textarea> fields into custom_fields
 *
 * This lets clients freely write their own external API URL inside the HTML.
 * The platform will always intercept submissions → save to DB → forward to
 * the client's original URL via the webhook pipeline.
 *
 * @param {string} htmlContent  - Raw HTML string from the editor
 * @param {string|null} existingWebhookUrl - Any webhook_url already stored for this content
 * @returns {{ content: string, webhook_url: string|null, custom_fields: Array }}
 */
function processHtmlContent(htmlContent, existingWebhookUrl = null) {
    if (!htmlContent) return { content: htmlContent, webhook_url: existingWebhookUrl, custom_fields: [] };

    let processedContent = htmlContent;
    let detectedWebhookUrl = existingWebhookUrl || null;

    console.log('[processHtmlContent] Starting HTML processing...');
    console.log('[processHtmlContent] Existing webhook URL:', existingWebhookUrl);

    // Helper: validate and clean extracted API URL
    const cleanExtractedUrl = (rawUrl) => {
        if (!rawUrl || typeof rawUrl !== 'string') return null;
        let trimmed = rawUrl.trim();
        // Fix backslashes -> forward slashes (common copy-paste mistake on Windows: "https://x.ngrok.io\api\users")
        trimmed = trimmed.replace(/\\/g, '/');
        // Ignore platform endpoint or placeholders
        if (
            trimmed.includes('/api/public/landing-page') ||
            trimmed.includes('your-api-url.com') ||
            trimmed.includes('example.com') ||
            trimmed === '#' ||
            trimmed.startsWith('javascript:')
        ) {
            return null;
        }
        return trimmed;
    };

    // ── Step 1a: Extract action from HTML <form action="..."> ────────────────
    const formActionRegex = /<form(\b[^>]*)\baction=["']([^"']+)["']/gi;
    let formActionMatch;
    while ((formActionMatch = formActionRegex.exec(processedContent)) !== null) {
        const rawAction = formActionMatch[2];
        const cleanedAction = cleanExtractedUrl(rawAction);
        if (cleanedAction) {
            detectedWebhookUrl = cleanedAction;
            console.log(`[processHtmlContent] Detected form action API URL: ${cleanedAction}`);
            break;
        }
    }

    // ── Step 1b: Extract client API URL from JS scripts (const/let/var API_URL = "...", fetch("..."), axios.post("...")) ────
    const scriptApiPatterns = [
        /(?:const|let|var)\s+(?:API_URL|apiUrl|API_ENDPOINT|endpoint|clientApi|webhookUrl|webhook_url)\s*=\s*[`"']([^`"']+)[`"']/gi,
        /fetch\(\s*[`"'](https?:\/\/[^`"']+)[`"']/gi,
        /axios(?:\.post|\.put|\.get)?\(\s*[`"'](https?:\/\/[^`"']+)[`"']/gi,
        /url\s*:\s*[`"'](https?:\/\/[^`"']+)[`"']/gi,
        /xhr\.open\(\s*[`"'](?:POST|GET|PUT)[`"']\s*,\s*[`"'](https?:\/\/[^`"']+)[`"']/gi
    ];

    for (const pattern of scriptApiPatterns) {
        let match;
        while ((match = pattern.exec(processedContent)) !== null) {
            const rawUrl = match[1];
            const cleaned = cleanExtractedUrl(rawUrl);
            if (cleaned) {
                detectedWebhookUrl = cleaned;
                console.log(`[processHtmlContent] Detected JS script API URL: ${cleaned}`);
                break;
            }
        }
        if (detectedWebhookUrl && detectedWebhookUrl !== existingWebhookUrl) break;
    }

    // ── Step 2: Rewrite JS API_URL variables in the HTML to point to platform endpoint ──
    const apiUrlRegex = /(?:const|let|var)\s+(?:API_URL|apiUrl|API_ENDPOINT|endpoint|clientApi|webhookUrl|webhook_url)\s*=\s*[`"']([^`"']*)[`"']/gi;
    processedContent = processedContent.replace(
        apiUrlRegex,
        `const API_URL = "/api/public/landing-page"`
    );

    // ── Step 2b: Patch fetch / axios body to send { content_id: window.__CONTENT_ID, extra_fields: ... } ──
    const bodyPatterns = [
        /body\s*:\s*JSON\.stringify\(\s*(\w+)\s*\)/g,
        /body\s*:\s*JSON\.stringify\(\s*\{\s*\.\.\.(\w+)\s*\}\s*\)/g,
        /data\s*:\s*JSON\.stringify\(\s*(\w+)\s*\)/g
    ];

    bodyPatterns.forEach(pattern => {
        processedContent = processedContent.replace(
            pattern,
            (match, varName) => {
                if (varName === 'content_id' || varName.includes('extra_fields')) return match;
                console.log('[processHtmlContent] Patching fetch body pattern:', match);
                return `body: JSON.stringify({ content_id: window.__CONTENT_ID, extra_fields: ${varName} })`;
            }
        );
    });

    // ── Step 3: Rewrite HTML <form action="..."> to point to /api/public/landing-page ──
    processedContent = processedContent.replace(
        /<form(\b[^>]*)\baction=["'](?!(?:\/api\/public\/landing-page|#|javascript:))[^"']*["']/gi,
        (match, attrs) => {
            console.log('[processHtmlContent] Rewriting form action:', match);
            return `<form${attrs} action="/api/public/landing-page"`;
        }
    );

    // ── Step 3b: Add hidden content_id field to HTML forms ──
    processedContent = processedContent.replace(
        /<form([^>]*action=["']\/api\/public\/landing-page["'][^>]*)>/gi,
        (match, attrs) => {
            if (match.includes('name="content_id"')) return match;
            console.log('[processHtmlContent] Adding hidden content_id field to form');
            return `<form${attrs}>
    <input type="hidden" name="content_id" value="" id="form-content-id" />`;
        }
    );

    // ── Step 3c: Add script to populate content_id hidden field from window.__CONTENT_ID ──
    const contentIdScript = `
    <script>
    (function() {
        console.log('HTML Builder: Setting up content_id injection');
        setTimeout(function() {
            const contentIdField = document.getElementById('form-content-id');
            if (contentIdField && window.__CONTENT_ID) {
                contentIdField.value = window.__CONTENT_ID;
                console.log('HTML Builder: Set content_id to:', window.__CONTENT_ID);
            } else {
                console.warn('HTML Builder: Could not set content_id - field or window.__CONTENT_ID not found');
            }
        }, 100);
    })();
    </script>`;
    if (processedContent.includes('action="/api/public/landing-page"') && !processedContent.includes('HTML Builder: Setting up content_id injection')) {
        processedContent = processedContent.replace(/<\/body>/gi, `${contentIdScript}</body>`);
        console.log('[processHtmlContent] Added content_id injection script');
    }

    // ── Step 4: Parse form fields from the HTML ──────────────────────────────
    const customFields = [];
    const seenNames = new Set();
    const tagRegex = /<(input|select|textarea)\b([^>]*)>/gi;
    let match;
    let fieldIndex = 0;

    while ((match = tagRegex.exec(processedContent)) !== null) {
        const tagName = match[1].toLowerCase();
        const attrsText = match[2];

        const nameMatch = attrsText.match(/name=["']([^"']*)["']/i) || attrsText.match(/id=["']([^"']*)["']/i);
        const typeMatch = attrsText.match(/type=["']([^"']*)["']/i);
        const phMatch = attrsText.match(/placeholder=["']([^"']*)["']/i);
        const isRequired = /\brequired\b/i.test(attrsText);

        const rawName = nameMatch ? nameMatch[1] : null;
        if (!rawName) continue;

        const fieldType = tagName === 'textarea' ? 'textarea' : (typeMatch ? typeMatch[1] : 'text');
        if (fieldType === 'submit' || fieldType === 'button' || fieldType === 'hidden') continue;

        const normalizedName = rawName.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^([0-9])/, '_$1').substring(0, 64);
        if (seenNames.has(normalizedName)) continue;
        seenNames.add(normalizedName);

        customFields.push({
            id: Date.now() + fieldIndex,
            name: normalizedName,
            label: phMatch ? phMatch[1] : rawName,
            type: fieldType,
            placeholder: phMatch ? phMatch[1] : '',
            required: isRequired,
            webhook_key: rawName
        });
        fieldIndex++;
    }

    console.log('[processHtmlContent] Parsed', customFields.length, 'form fields');
    console.log('[processHtmlContent] Final webhook URL:', detectedWebhookUrl);

    return {
        content: processedContent,
        webhook_url: detectedWebhookUrl,
        custom_fields: customFields
    };
}

/**
 * Extract webhook URL (apiUrl) from Visual Builder JSON trees (builder_page_data or builder_layout)
 */
function extractWebhookUrlFromBuilder(pageDataRaw) {
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
}

class Content {
    static async create(contentData) {
        let {
            user_id, content_type_id, category_id, title, short_description,
            tags, banner_image, pdf_file, video_file, custom_fields, content, webhook_url,
            webhook_field_mapping, builder_layout, builder_content_elements, builder_page_data,
            seo_meta_title, seo_meta_description, seo_meta_keywords,
            scheduled_publish_date, webinar_date, hosted_by, platform, webinar_type = 'live', join_link, status = 'draft',
            email_subject, email_template, case_study_headline, case_study_summary,
            is_visible_on_site = true
        } = contentData;

        // ── Auto-process HTML builder content ────────────────────────────────
        // If this is an HTML builder page, intercept any inline API_URL the client
        // wrote, save it as webhook_url, rewrite the HTML to submit through the
        // platform, and auto-parse form fields — all transparently on save.
        const isHtmlBuilder = (() => {
            try {
                const layout = typeof builder_layout === 'string' ? JSON.parse(builder_layout) : builder_layout;
                return Array.isArray(layout) && layout[0] === 'html';
            } catch { return false; }
        })();

        if (isHtmlBuilder && content) {
            // Use manually provided webhook_url if available, otherwise extract from HTML
            const manualWebhookUrl = webhook_url || null;
            console.log('[Content.create] Manual webhook_url:', manualWebhookUrl);
            console.log('[Content.create] Processing HTML content...');
            const processed = processHtmlContent(content, manualWebhookUrl);
            content = processed.content;

            // Priority: manual webhook_url > HTML-extracted webhook_url
            // If manual webhook_url is explicitly provided (not null/undefined), use it
            // Otherwise, use the HTML-extracted webhook_url
            if (manualWebhookUrl !== null && manualWebhookUrl !== undefined && manualWebhookUrl !== '') {
                webhook_url = manualWebhookUrl;
                console.log('[Content.create] Using manual webhook_url:', webhook_url);
            } else {
                webhook_url = processed.webhook_url;
                console.log('[Content.create] Using HTML-extracted webhook_url:', webhook_url);
            }

            console.log('[Content.create] Final webhook_url:', webhook_url);

            // Auto-fill custom_fields from HTML form inputs if not already set by the user
            if ((!custom_fields || (Array.isArray(custom_fields) && custom_fields.length === 0)) && processed.custom_fields.length > 0) {
                custom_fields = processed.custom_fields;
                console.log('[Content.create] Auto-filled custom_fields from HTML:', custom_fields.length, 'fields');
            }
        }

        // Auto-extract webhook_url for Visual Drag & Drop Builder pages if not set manually
        if (!webhook_url) {
            const builderWebhook = extractWebhookUrlFromBuilder(builder_page_data) ||
                extractWebhookUrlFromBuilder(builder_layout) ||
                extractWebhookUrlFromBuilder(builder_content_elements);
            if (builderWebhook) {
                webhook_url = builderWebhook;
                console.log('[Content.create] Auto-extracted webhook_url from Visual Builder:', webhook_url);
            }
        }

        const slug = slugify(title ? String(title).trim() : `untitled-${Date.now()}`, { lower: true, strict: true }) || `untitled-${Date.now()}`;
        const wordCount = (content || '').split(/\s+/).length;
        const reading_time = Math.ceil(wordCount / 200);

        console.log('[Content.create] Input data keys:', Object.keys(contentData));
        console.log('[Content.create] user_id:', user_id, 'content_type_id:', content_type_id, 'category_id:', category_id);
        console.log('[Content.create] title:', title, 'slug:', slug);

        const scalarize = (val) => {
            if (val === null || val === undefined) return null;
            if (typeof val === 'string') return val;
            if (typeof val === 'number' || typeof val === 'boolean') return val;
            return JSON.stringify(val);
        };

        const insertColumns = [
            'user_id', 'content_type_id', 'category_id', 'title', 'slug', 'short_description',
            'tags', 'banner_image', 'pdf_file', 'video_file', 'custom_fields', 'content', 'webhook_url',
            'webhook_field_mapping', 'builder_layout', 'builder_content_elements',
            'builder_page_data', 'seo_meta_title', 'seo_meta_description', 'seo_meta_keywords',
            'scheduled_publish_date', 'webinar_date', 'hosted_by', 'platform', 'webinar_type', 'join_link',
            'reading_time', 'status', 'is_visible_on_site',
            'email_subject', 'email_template', 'case_study_headline', 'case_study_summary'
        ];

        const rawValues = [
            user_id,
            content_type_id,
            category_id,
            title,
            slug,
            short_description,
            tags,
            banner_image,
            pdf_file || null,
            video_file || null,
            custom_fields,
            content,
            webhook_url || null,
            webhook_field_mapping,
            builder_layout,
            builder_content_elements,
            builder_page_data,
            seo_meta_title,
            seo_meta_description,
            seo_meta_keywords,
            scheduled_publish_date,
            webinar_date || null,
            hosted_by || null,
            platform || null,
            webinar_type || 'live',
            join_link || null,
            reading_time,
            status,
            is_visible_on_site,
            email_subject || null,
            email_template || null,
            case_study_headline || null,
            case_study_summary || null
        ];

        const insertValues = rawValues.map(v => scalarize(v));
        const placeholders = insertColumns.map(() => '?').join(', ');
        const query = `INSERT INTO contents (${insertColumns.join(', ')}) VALUES (${placeholders})`;

        console.log('[Content.create] Columns:', insertColumns.length);
        console.log('[Content.create] Values count:', insertValues.length, 'Placeholders count:', insertColumns.length);
        if (insertColumns.length !== insertValues.length) {
            console.error('[Content.create] FATAL: Column/value mismatch!', insertColumns.length, 'vs', insertValues.length);
        }

        const [result] = await pool.query(query, insertValues);

        // No need to replace placeholder anymore since we're using window.__CONTENT_ID

        const newContent = await Content.findById(result.insertId);

        // Create dynamic table for form submissions if custom_fields exist
        if (custom_fields && Array.isArray(custom_fields) && custom_fields.length > 0) {
            try {
                await createDynamicTable(result.insertId, newContent.slug, custom_fields);
            } catch (tableError) {
                console.error('Error creating dynamic table for content:', tableError);
                // Don't fail content creation if table creation fails
            }
        }

        return newContent;
    }

    static async findById(id) {
        const query = `
            SELECT c.*, 
                   u.first_name, u.last_name, u.email as author_email,
                   ct.name as content_type_name,
                   ct.slug as content_type,
                   cat.name as category_name, cat.slug as category_slug
            FROM contents c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE c.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0];
    }

    static async findBySlug(slug) {
        const query = `
            SELECT c.*, 
                   u.first_name, u.last_name, u.email as author_email,
                   ct.name as content_type_name,
                   ct.slug as content_type,
                   cat.name as category_name, cat.slug as category_slug
            FROM contents c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE c.slug = ? AND c.status = 'published' AND (c.is_visible_on_site = 1 OR c.is_visible_on_site IS NULL) AND (c.scheduled_publish_date IS NULL OR c.scheduled_publish_date <= CURRENT_TIMESTAMP)
        `;
        const [rows] = await pool.query(query, [slug]);
        return rows[0];
    }

    /**
     * Find content by slug regardless of publish status.
     * Used for form submission resolution so that landing page forms work
     * even when content is still in draft or pending state.
     */
    static async findBySlugAny(slug) {
        const query = `
            SELECT c.*, 
                   u.first_name, u.last_name, u.email as author_email,
                   ct.name as content_type_name,
                   ct.slug as content_type,
                   cat.name as category_name, cat.slug as category_slug
            FROM contents c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE c.slug = ?
        `;
        const [rows] = await pool.query(query, [slug]);
        return rows[0];
    }

    static async findAll(filters = {}) {
        let baseWhere = ' WHERE 1=1';
        const values = [];

        if (filters.status) {
            baseWhere += ' AND c.status = ?';
            values.push(filters.status);
            if (filters.status === 'published') {
                baseWhere += ' AND (c.scheduled_publish_date IS NULL OR c.scheduled_publish_date <= CURRENT_TIMESTAMP)';
            }
        }
        if (filters.user_id) { baseWhere += ' AND c.user_id = ?'; values.push(filters.user_id); }
        if (filters.category_id) { baseWhere += ' AND c.category_id = ?'; values.push(filters.category_id); }
        if (filters.content_type_id) { baseWhere += ' AND c.content_type_id = ?'; values.push(filters.content_type_id); }

        // Filter by is_visible_on_site if explicitly provided (for public listings)
        // Admin queries don't set this filter, so they see all content
        if (filters.is_visible_on_site !== undefined) {
            if (filters.is_visible_on_site === true || filters.is_visible_on_site === 1 || filters.is_visible_on_site === '1') {
                baseWhere += ' AND (c.is_visible_on_site = 1 OR c.is_visible_on_site IS NULL)';
            } else {
                baseWhere += ' AND c.is_visible_on_site = 0';
            }
        }

        // Add date filtering support
        if (filters.start_date) {
            baseWhere += ' AND c.created_at >= ?';
            values.push(filters.start_date);
        }
        if (filters.end_date) {
            baseWhere += ' AND c.created_at <= ?';
            values.push(filters.end_date);
        }

        // total count
        const countQuery = `SELECT COUNT(*) as total FROM contents c LEFT JOIN content_types ct ON c.content_type_id = ct.id LEFT JOIN categories cat ON c.category_id = cat.id${baseWhere}`;
        const [countRows] = await pool.query(countQuery, values);
        const total = countRows[0].total;

        let query = `
            SELECT c.*, 
                   u.first_name, u.last_name,
                   ct.name as content_type_name,
                   ct.slug as content_type,
                   cat.name as category_name
            FROM contents c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            ${baseWhere} ORDER BY c.created_at DESC
        `;

        const pageValues = [...values];
        if (filters.limit) {
            const safeLimit = Math.max(1, Math.min(100, parseInt(filters.limit, 10) || 10));
            query += ' LIMIT ?';
            pageValues.push(safeLimit);
        }
        if (filters.offset !== undefined && filters.offset !== null) {
            const safeOffset = Math.max(0, parseInt(filters.offset, 10) || 0);
            query += ' OFFSET ?';
            pageValues.push(safeOffset);
        }

        const [rows] = await pool.query(query, pageValues);
        return { rows, total };
    }

    static async update(id, contentData) {
        console.log('[Content.update] Starting update for content ID:', id);
        console.log('[Content.update] contentData.webhook_url:', contentData.webhook_url);

        // ── Auto-process HTML builder content on update ───────────────────────
        const isHtmlBuilder = (() => {
            try {
                const layout = contentData.builder_layout
                    ? (typeof contentData.builder_layout === 'string' ? JSON.parse(contentData.builder_layout) : contentData.builder_layout)
                    : null;
                if (layout) return Array.isArray(layout) && layout[0] === 'html';
                // If builder_layout not changing, check existing record
                return false;
            } catch { return false; }
        })();

        if (isHtmlBuilder && contentData.content) {
            console.log('[Content.update] Processing HTML builder content');

            // Fetch existing webhook_url from database
            let existingWebhookUrl = null;
            try {
                const [rows] = await pool.query('SELECT webhook_url FROM contents WHERE id = ?', [id]);
                existingWebhookUrl = rows[0]?.webhook_url || null;
                console.log('[Content.update] Existing webhook_url from DB:', existingWebhookUrl);
            } catch (err) {
                console.error('[Content.update] Error fetching existing webhook_url:', err);
            }

            // Determine which webhook URL to use as the base for processing
            const manualWebhookUrl = (contentData.webhook_url && typeof contentData.webhook_url === 'string' && contentData.webhook_url.trim())
                ? contentData.webhook_url.trim()
                : null;
            const baseWebhookUrl = manualWebhookUrl || existingWebhookUrl;

            console.log('[Content.update] Manual webhook_url:', manualWebhookUrl);
            console.log('[Content.update] Base webhook_url for processing:', baseWebhookUrl);

            const processed = processHtmlContent(contentData.content, baseWebhookUrl);
            contentData.content = processed.content;

            // Priority logic:
            // 1. If manual non-empty webhook_url is explicitly provided, use it
            // 2. Otherwise, use HTML-extracted webhook_url if found
            // 3. Otherwise, preserve existing webhook_url from DB
            if (manualWebhookUrl) {
                contentData.webhook_url = manualWebhookUrl;
                console.log('[Content.update] Using non-empty manual webhook_url:', contentData.webhook_url);
            } else if (processed.webhook_url) {
                contentData.webhook_url = processed.webhook_url;
                console.log('[Content.update] Using HTML-extracted webhook_url:', processed.webhook_url);
            } else if (existingWebhookUrl) {
                contentData.webhook_url = existingWebhookUrl;
                console.log('[Content.update] Preserving existing webhook_url from DB:', existingWebhookUrl);
            } else {
                contentData.webhook_url = null;
            }

            console.log('[Content.update] Final webhook_url:', contentData.webhook_url);

            // Auto-fill custom_fields from parsed HTML fields if not explicitly provided
            if (!contentData.custom_fields && processed.custom_fields.length > 0) {
                contentData.custom_fields = JSON.stringify(processed.custom_fields);
                console.log('[Content.update] Auto-filled custom_fields from HTML:', processed.custom_fields.length, 'fields');
            }
        } else if (!contentData.webhook_url) {
            // Visual Builder page update: auto-extract webhook_url from builder tree if not set manually
            const builderWebhook = extractWebhookUrlFromBuilder(contentData.builder_page_data) ||
                extractWebhookUrlFromBuilder(contentData.builder_layout) ||
                extractWebhookUrlFromBuilder(contentData.builder_content_elements);
            if (builderWebhook) {
                contentData.webhook_url = builderWebhook;
                console.log('[Content.update] Auto-extracted webhook_url from Visual Builder:', contentData.webhook_url);
            }
        }

        const scalarizeVal = (val) => {
            if (val === null || val === undefined) return null;
            if (typeof val === 'string') return val;
            if (typeof val === 'number' || typeof val === 'boolean') return val;
            return JSON.stringify(val);
        };

        const allowedFields = [
            'title', 'short_description', 'tags', 'banner_image', 'pdf_file', 'video_file', 'custom_fields', 'content',
            'seo_meta_title', 'seo_meta_description', 'seo_meta_keywords',
            'scheduled_publish_date', 'webinar_date', 'hosted_by', 'platform', 'webinar_type', 'join_link',
            'status', 'category_id', 'content_type_id', 'webhook_url',
            'webhook_field_mapping', 'builder_layout', 'builder_content_elements', 'builder_page_data',
            'is_visible_on_site', 'email_subject', 'email_template', 'case_study_headline', 'case_study_summary'
        ];

        const updates = [];
        const values = [];
        let placeholderCount = 0;

        for (const field of allowedFields) {
            if (contentData[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(scalarizeVal(contentData[field]));
                placeholderCount++;
            }
        }

        if (contentData.title) {
            const newSlug = slugify(String(contentData.title).trim(), { lower: true, strict: true }) || `untitled-${Date.now()}`;
            const [existing] = await pool.query('SELECT slug FROM contents WHERE id = ?', [id]);
            if (existing[0]?.slug !== newSlug) {
                const [conflict] = await pool.query('SELECT id FROM contents WHERE slug = ? AND id != ?', [newSlug, id]);
                updates.push('slug = ?');
                values.push(conflict.length > 0 ? `${newSlug}-${id}` : newSlug);
                placeholderCount++;
            }
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        placeholderCount++;

        const placeholdersExpected = updates.filter(u => u.includes('?')).length + 1;
        console.log('[Content.update] Placeholders:', placeholderCount, 'Values:', values.length);
        if (placeholderCount !== values.length) {
            console.error('[Content.update] FATAL: Placeholder/value mismatch!', placeholderCount, 'vs', values.length);
        }

        await pool.query(`UPDATE contents SET ${updates.join(', ')} WHERE id = ?`, values);
        const updatedContent = await Content.findById(id);

        // Update dynamic table if custom_fields changed
        if (contentData.custom_fields !== undefined) {
            try {
                const customFields = typeof contentData.custom_fields === 'string'
                    ? JSON.parse(contentData.custom_fields)
                    : contentData.custom_fields;

                if (customFields && Array.isArray(customFields) && customFields.length > 0) {
                    await updateDynamicTable(`form_submissions_${id}`, customFields);
                }
            } catch (tableError) {
                console.error('Error updating dynamic table for content:', tableError);
                // Don't fail content update if table update fails
            }
        }

        return updatedContent;
    }

    static async updateStatus(id, status, admin_comment = null) {
        let query = 'UPDATE contents SET status = ?, updated_at = CURRENT_TIMESTAMP';
        const values = [status];

        if (admin_comment) { query += ', admin_comment = ?'; values.push(admin_comment); }
        if (status === 'published') { query += ', published_date = COALESCE(scheduled_publish_date, CURRENT_TIMESTAMP)'; }

        query += ' WHERE id = ?';
        values.push(id);

        await pool.query(query, values);
        return await Content.findById(id);
    }

    static async incrementViewCount(id) {
        console.log('👁️ Incrementing view count for content ID:', id);
        const [result] = await pool.query(
            'UPDATE contents SET view_count = view_count + 1, views_count = views_count + 1 WHERE id = ?',
            [id]
        );
        console.log('👁️ View count increment result:', result.affectedRows > 0 ? 'SUCCESS' : 'FAILED');
        return result.affectedRows > 0;
    }

    static async getRelatedArticles(contentId, categoryId, limit = 3) {
        const query = `
            SELECT c.*, u.first_name, u.last_name, ct.slug as content_type
            FROM contents c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            WHERE c.category_id = ? AND c.id != ? AND c.status = 'published' 
              AND (c.is_visible_on_site = 1 OR c.is_visible_on_site IS NULL)
              AND (c.scheduled_publish_date IS NULL OR c.scheduled_publish_date <= CURRENT_TIMESTAMP)
            ORDER BY c.published_date DESC
            LIMIT ?
        `;
        const [rows] = await pool.query(query, [categoryId, contentId, limit]);
        return rows;
    }

    static async delete(id) {
        // Drop dynamic table if it exists
        try {
            await dropDynamicTable(id);
        } catch (tableError) {
            console.error('Error dropping dynamic table for content:', tableError);
            // Don't fail content deletion if table drop fails
        }

        await pool.query('DELETE FROM contents WHERE id = ?', [id]);
    }

    static async getPopularTags(limit = 20) {
        const query = `
            SELECT 
                TRIM(BOTH ',' FROM SUBSTRING_INDEX(SUBSTRING_INDEX(tags, ',', n), ',', -1)) as tag,
                COUNT(*) as count
            FROM contents
            CROSS JOIN (
                SELECT 1 as n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
                UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
            ) numbers
            WHERE tags IS NOT NULL 
            AND tags != ''
            AND TRIM(BOTH ',' FROM SUBSTRING_INDEX(SUBSTRING_INDEX(tags, ',', n), ',', -1)) != ''
            AND status = 'published'
            AND (is_visible_on_site = 1 OR is_visible_on_site IS NULL)
            AND (scheduled_publish_date IS NULL OR scheduled_publish_date <= CURRENT_TIMESTAMP)
            GROUP BY tag
            ORDER BY count DESC
            LIMIT ?
        `;
        const [rows] = await pool.query(query, [limit]);
        return rows;
    }
}

module.exports = Content;
