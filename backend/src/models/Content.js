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
    let detectedWebhookUrl = existingWebhookUrl;

    console.log('[processHtmlContent] Starting HTML processing...');
    console.log('[processHtmlContent] Existing webhook URL:', existingWebhookUrl);

    // ── Step 1: Extract any client-defined API_URL from the inline script ────
    // Matches both:  const API_URL = "...";  and  const API_URL="...";
    // Also handles strings that mistakenly use backslashes (e.g. ngrok URL pasted from Windows)
    const apiUrlRegex = /const\s+API_URL\s*=\s*[`"']([^`"']*)[`"']/i;
    const apiUrlMatch = processedContent.match(apiUrlRegex);

    if (apiUrlMatch) {
        const rawUrl = apiUrlMatch[1];
        console.log('[processHtmlContent] Found API_URL in HTML:', rawUrl);

        // Determine if this is already the platform endpoint or a real external URL
        const isPlatformEndpoint = rawUrl.includes('/api/public/landing-page') ||
                                   rawUrl.includes('your-api-url.com');

        if (!isPlatformEndpoint) {
            // Fix backslashes → forward slashes  (common copy-paste mistake: "https://x.ngrok.io\api\users")
            const cleanedUrl = rawUrl.replace(/\\/g, '/');
            detectedWebhookUrl = cleanedUrl;
            console.log(`[processHtmlContent] Detected client API URL: ${cleanedUrl} — saving as webhook_url`);
        } else {
            console.log(`[processHtmlContent] API_URL is a platform endpoint or placeholder, skipping webhook detection`);
        }

        // ── Step 2: Rewrite the API_URL in the HTML to always hit the platform ──
        // Don't inject const CONTENT_ID because StandaloneLandingPage.jsx already sets window.__CONTENT_ID
        processedContent = processedContent.replace(
            apiUrlRegex,
            `const API_URL = "/api/public/landing-page"`
        );
        console.log('[processHtmlContent] Rewrote API_URL to /api/public/landing-page in HTML content');

        // ── Step 2b: Patch the fetch body to wrap form data with content_id + extra_fields ──
        // Replace:  body: JSON.stringify(leadData)
        // With:     body: JSON.stringify({ content_id: window.__CONTENT_ID, extra_fields: leadData })
        // This ensures the backend can resolve the correct content record and
        // insert the submission into the right form_submissions_<id> table.
        // We use window.__CONTENT_ID because StandaloneLandingPage.jsx sets it automatically.
        const bodyPatterns = [
            // Pattern 1: body: JSON.stringify(leadData)
            /body\s*:\s*JSON\.stringify\(\s*(\w+)\s*\)/g,
            // Pattern 2: body: JSON.stringify({...leadData})
            /body\s*:\s*JSON\.stringify\(\s*\{\s*\.\.\.(\w+)\s*\}\s*\)/g
        ];

        bodyPatterns.forEach(pattern => {
            processedContent = processedContent.replace(
                pattern,
                (match, varName) => {
                    console.log('[processHtmlContent] Patching fetch body pattern:', match);
                    return `body: JSON.stringify({ content_id: window.__CONTENT_ID, extra_fields: ${varName} })`;
                }
            );
        });
    } else {
        console.log('[processHtmlContent] No API_URL found in HTML content');
    }

    // ── Step 3: Also rewrite any HTML <form action="..."> pointing to external URLs ──
    // Some clients set action= on the form tag directly instead of using JS
    processedContent = processedContent.replace(
        /<form(\b[^>]*)\baction=["'](?!(?:\/api\/public\/landing-page|#|javascript:))[^"']*["']/gi,
        (match, attrs) => {
            console.log('[processHtmlContent] Rewriting form action:', match);
            return `<form${attrs} action="/api/public/landing-page"`;
        }
    );

    // ── Step 3b: Add hidden content_id field to HTML forms that submit to /api/public/landing-page
    // This ensures HTML forms (without JS) also include the content_id
    processedContent = processedContent.replace(
        /<form([^>]*action=["']\/api\/public\/landing-page["'][^>]*)>/gi,
        (match, attrs) => {
            // Check if content_id hidden field already exists
            if (match.includes('name="content_id"')) {
                return match; // Already has content_id field
            }
            // Insert hidden content_id field right after the form tag
            console.log('[processHtmlContent] Adding hidden content_id field to form');
            return `<form${attrs}>
    <input type="hidden" name="content_id" value="" id="form-content-id" />`;
        }
    );

    // ── Step 3c: Add script to populate content_id hidden field from window.__CONTENT_ID
    // This script runs after the page loads to set the correct content_id
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
    // Only add the script if it doesn't already exist and if there's a form
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

        const nameMatch  = attrsText.match(/name=["']([^"']*)["']/i) || attrsText.match(/id=["']([^"']*)["']/i);
        const typeMatch  = attrsText.match(/type=["']([^"']*)["']/i);
        const phMatch    = attrsText.match(/placeholder=["']([^"']*)["']/i);
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
            // Preserve the original field name as webhook_key so the platform
            // can forward it with the exact key the client's API expects
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

class Content {
    static async create(contentData) {
        let {
            user_id, content_type_id, category_id, title, short_description,
            tags, banner_image, pdf_file, custom_fields, content, webhook_url,
            webhook_field_mapping, builder_layout, builder_content_elements, builder_page_data,
            seo_meta_title, seo_meta_description, seo_meta_keywords,         
            scheduled_publish_date, status = 'draft',
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
            'tags', 'banner_image', 'pdf_file', 'custom_fields', 'content', 'webhook_url',
            'webhook_field_mapping', 'builder_layout', 'builder_content_elements',
            'builder_page_data', 'seo_meta_title', 'seo_meta_description', 'seo_meta_keywords',
            'scheduled_publish_date', 'reading_time', 'status', 'is_visible_on_site',
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
            WHERE c.slug = ? AND c.status = 'published'
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

        if (filters.status) { baseWhere += ' AND c.status = ?'; values.push(filters.status); }
        if (filters.user_id) { baseWhere += ' AND c.user_id = ?'; values.push(filters.user_id); }
        if (filters.category_id) { baseWhere += ' AND c.category_id = ?'; values.push(filters.category_id); }
        if (filters.content_type_id) { baseWhere += ' AND c.content_type_id = ?'; values.push(filters.content_type_id); }
        
        // Filter by is_visible_on_site if explicitly provided (for public listings)
        // Admin queries don't set this filter, so they see all content
        if (filters.is_visible_on_site !== undefined) { 
            baseWhere += ' AND c.is_visible_on_site = ?'; 
            values.push(filters.is_visible_on_site); 
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
        if (filters.limit) { query += ' LIMIT ?'; pageValues.push(filters.limit); }
        if (filters.offset !== undefined && filters.offset !== null) { query += ' OFFSET ?'; pageValues.push(filters.offset); }

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
            const manualWebhookUrl = contentData.webhook_url;
            const baseWebhookUrl = manualWebhookUrl !== undefined ? manualWebhookUrl : existingWebhookUrl;
            
            console.log('[Content.update] Manual webhook_url:', manualWebhookUrl);
            console.log('[Content.update] Base webhook_url for processing:', baseWebhookUrl);

            const processed = processHtmlContent(contentData.content, baseWebhookUrl);
            contentData.content = processed.content;
            
            // Priority logic:
            // 1. If webhook_url is explicitly provided in contentData (even if empty string), use it
            // 2. Otherwise, use HTML-extracted webhook_url if found
            // 3. Otherwise, preserve existing webhook_url
            if (contentData.webhook_url !== undefined) {
                // Explicitly provided (could be null, empty string, or a URL) - use as-is
                console.log('[Content.update] Using explicitly provided webhook_url:', contentData.webhook_url);
            } else if (processed.webhook_url) {
                // HTML-extracted webhook URL found
                contentData.webhook_url = processed.webhook_url;
                console.log('[Content.update] Using HTML-extracted webhook_url:', processed.webhook_url);
            } else {
                // Preserve existing webhook URL
                contentData.webhook_url = existingWebhookUrl;
                console.log('[Content.update] Preserving existing webhook_url:', existingWebhookUrl);
            }

            console.log('[Content.update] Final webhook_url:', contentData.webhook_url);

            // Auto-fill custom_fields from parsed HTML fields if not explicitly provided
            if (!contentData.custom_fields && processed.custom_fields.length > 0) {
                contentData.custom_fields = JSON.stringify(processed.custom_fields);
                console.log('[Content.update] Auto-filled custom_fields from HTML:', processed.custom_fields.length, 'fields');
            }
        }

        const scalarizeVal = (val) => {
            if (val === null || val === undefined) return null;
            if (typeof val === 'string') return val;
            if (typeof val === 'number' || typeof val === 'boolean') return val;
            return JSON.stringify(val);
        };

        const allowedFields = [
            'title', 'short_description', 'tags', 'banner_image', 'pdf_file', 'custom_fields', 'content',
            'seo_meta_title', 'seo_meta_description', 'seo_meta_keywords',
            'scheduled_publish_date', 'status', 'category_id', 'content_type_id', 'webhook_url',
            'webhook_field_mapping', 'builder_layout', 'builder_content_elements', 'builder_page_data',
            'is_visible_on_site'
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
        const [result] = await pool.query('UPDATE contents SET view_count = view_count + 1 WHERE id = ?', [id]);
        console.log('👁️ View count increment result:', result.affectedRows > 0 ? 'SUCCESS' : 'FAILED');
        return result.affectedRows > 0;
    }

    static async getRelatedArticles(contentId, categoryId, limit = 3) {
        const query = `
            SELECT c.*, u.first_name, u.last_name, ct.slug as content_type
            FROM contents c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            WHERE c.category_id = ? AND c.id != ? AND c.status = 'published' AND c.is_visible_on_site = 1
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
            GROUP BY tag
            ORDER BY count DESC
            LIMIT ?
        `;
        const [rows] = await pool.query(query, [limit]);
        return rows;
    }
}

module.exports = Content;
