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

    // ── Step 1: Extract any client-defined API_URL from the inline script ────
    // Matches both:  const API_URL = "...";  and  const API_URL="...";
    // Also handles strings that mistakenly use backslashes (e.g. ngrok URL pasted from Windows)
    const apiUrlRegex = /const\s+API_URL\s*=\s*[`"']([^`"']*)[`"']/i;
    const apiUrlMatch = processedContent.match(apiUrlRegex);

    if (apiUrlMatch) {
        const rawUrl = apiUrlMatch[1];

        // Determine if this is already the platform endpoint or a real external URL
        const isPlatformEndpoint = rawUrl.includes('/api/public/landing-page') ||
                                   rawUrl.includes('your-api-url.com');

        if (!isPlatformEndpoint) {
            // Fix backslashes → forward slashes  (common copy-paste mistake: "https://x.ngrok.io\api\users")
            const cleanedUrl = rawUrl.replace(/\\/g, '/');
            detectedWebhookUrl = cleanedUrl;
            console.log(`[HTML Builder] Detected client API URL: ${cleanedUrl} — saving as webhook_url`);
        }

        // ── Step 2: Rewrite the API_URL in the HTML to always hit the platform ──
        processedContent = processedContent.replace(
            apiUrlRegex,
            `const API_URL = "/api/public/landing-page"`
        );
        console.log('[HTML Builder] Rewrote API_URL to /api/public/landing-page in HTML content');
    }

    // ── Step 3: Also rewrite any HTML <form action="..."> pointing to external URLs ──
    // Some clients set action= on the form tag directly instead of using JS
    processedContent = processedContent.replace(
        /<form(\b[^>]*)\baction=["'](?!(?:\/api\/public\/landing-page|#|javascript:))[^"']*["']/gi,
        (match, attrs) => `<form${attrs} action="/api/public/landing-page"`
    );

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
            webhook_field_mapping, builder_layout, builder_content_elements,
            seo_meta_title, seo_meta_description, seo_meta_keywords,         
            scheduled_publish_date, status = 'draft',
            email_subject, email_template, case_study_headline, case_study_summary
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
            const processed = processHtmlContent(content, webhook_url || null);
            content     = processed.content;
            webhook_url = processed.webhook_url;
            // Auto-fill custom_fields from HTML form inputs if not already set by the user
            if ((!custom_fields || (Array.isArray(custom_fields) && custom_fields.length === 0)) && processed.custom_fields.length > 0) {
                custom_fields = processed.custom_fields;
            }
        }

        const slug = slugify(title, { lower: true, strict: true });
        const wordCount = (content || '').split(/\s+/).length;
        const reading_time = Math.ceil(wordCount / 200);

       const query = `
            INSERT INTO contents (
                user_id, content_type_id, category_id, title, slug,
                short_description, tags, banner_image, pdf_file, custom_fields, content, webhook_url,
                webhook_field_mapping, builder_layout, builder_content_elements,
                seo_meta_title, seo_meta_description, seo_meta_keywords,
                scheduled_publish_date, reading_time, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            user_id, content_type_id, category_id, title, slug,
            short_description, JSON.stringify(tags), banner_image,
            pdf_file || null,
            custom_fields ? JSON.stringify(custom_fields) : null,
            content,
            webhook_url || null,
            webhook_field_mapping ? JSON.stringify(webhook_field_mapping) : null,
            builder_layout ? (typeof builder_layout === 'string' ? builder_layout : JSON.stringify(builder_layout)) : null,
            builder_content_elements ? (typeof builder_content_elements === 'string' ? builder_content_elements : JSON.stringify(builder_content_elements)) : null,
            seo_meta_title, seo_meta_description, seo_meta_keywords,
            scheduled_publish_date, reading_time, status
        ];
        const [result] = await pool.query(query, values);
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
            // Fetch existing webhook_url so we don't overwrite a real one with null
            let existingWebhookUrl = contentData.webhook_url || null;
            if (!existingWebhookUrl) {
                try {
                    const [rows] = await pool.query('SELECT webhook_url FROM contents WHERE id = ?', [id]);
                    existingWebhookUrl = rows[0]?.webhook_url || null;
                } catch { /* ignore */ }
            }

            const processed = processHtmlContent(contentData.content, existingWebhookUrl);
            contentData.content = processed.content;
            contentData.webhook_url = processed.webhook_url;

            // Auto-fill custom_fields from parsed HTML fields if not explicitly provided
            if (!contentData.custom_fields && processed.custom_fields.length > 0) {
                contentData.custom_fields = JSON.stringify(processed.custom_fields);
            }
        }

        const allowedFields = [
            'title', 'short_description', 'tags', 'banner_image', 'pdf_file', 'custom_fields', 'content',
            'seo_meta_title', 'seo_meta_description', 'seo_meta_keywords',
            'scheduled_publish_date', 'status', 'category_id', 'content_type_id', 'webhook_url',
            'webhook_field_mapping', 'builder_layout', 'builder_content_elements'
        ];

        const updates = [];
        const values = [];

        for (const field of allowedFields) {
            if (contentData[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(contentData[field]);
            }
        }

        if (contentData.title) {
            const newSlug = slugify(contentData.title, { lower: true, strict: true });
            const [existing] = await pool.query('SELECT slug FROM contents WHERE id = ?', [id]);
            if (existing[0]?.slug !== newSlug) {
                const [conflict] = await pool.query('SELECT id FROM contents WHERE slug = ? AND id != ?', [newSlug, id]);
                updates.push('slug = ?');
                values.push(conflict.length > 0 ? `${newSlug}-${id}` : newSlug);
            }
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

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
        await pool.query('UPDATE contents SET view_count = view_count + 1 WHERE id = ?', [id]);
    }

    static async getRelatedArticles(contentId, categoryId, limit = 3) {
        const query = `
            SELECT c.*, u.first_name, u.last_name, ct.slug as content_type
            FROM contents c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN content_types ct ON c.content_type_id = ct.id
            WHERE c.category_id = ? AND c.id != ? AND c.status = 'published'
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
