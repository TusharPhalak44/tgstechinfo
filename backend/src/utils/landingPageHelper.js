const path = require('path');

/**
 * Returns the configured root directory for file-based landing pages.
 * Defaults to backend/landing-pages.
 */
function getLandingPagesRoot() {
    return path.resolve(process.env.LANDING_PAGES_DIR || path.join(__dirname, '../../landing-pages'));
}

/**
 * Validates a landing page slug.
 * Pattern: alphanumeric words separated by single hyphens or underscores.
 * E.g., 'healthcare-mychart-whitepaper', 'ai-infrastructure-2026'
 */
/**
 * Validates a landing page slug.
 * Allows letters, numbers, hyphens, underscores, ampersands, percent, spaces, and common URL-safe chars.
 */
function isValidSlug(slug) {
    if (!slug || typeof slug !== 'string') return false;
    const trimmed = slug.trim();
    if (trimmed.length < 1 || trimmed.length > 255) return false;
    // Disallow path traversal, hidden files, or dangerous control chars
    if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes('\0') || trimmed.includes('<') || trimmed.includes('>')) return false;
    const slugRegex = /^[a-zA-Z0-9\-_&%'.,\s]+$/;
    return slugRegex.test(trimmed);
}

/**
 * Constructs the canonical public URL for a file-based landing page.
 * @param {string} slug
 * @returns {string} E.g., '/lp/my-whitepaper'
 */
function getFileLandingPageUrl(slug) {
    if (!slug) return '/lp';
    const cleanSlug = slug.replace(/^\/+|\/+$/g, '');
    return `/lp/${cleanSlug}`;
}

/**
 * Maps common file extensions to safe MIME types.
 */
const EXT_MIME_MAP = {
    '.html': 'text/html; charset=UTF-8',
    '.htm': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.mjs': 'application/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.eot': 'application/vnd.ms-fontobject',
    '.txt': 'text/plain; charset=UTF-8',
    '.xml': 'application/xml; charset=UTF-8'
};

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return EXT_MIME_MAP[ext] || 'application/octet-stream';
}

const fs = require('fs');
const { pool } = require('../config/database');

/**
 * Automatically finds or creates a dedicated record in MySQL `contents` table
 * for a file-based landing page, ensuring each landing page folder has its own unique content ID.
 */
async function getOrCreateContentForLandingPage(slug, extraContext = {}) {
    if (!slug || typeof slug !== 'string') return null;
    const cleanSlug = slug.replace(/^\/+|\/+$/g, '').trim();
    const normalizedSlug = cleanSlug.toLowerCase();
    const slugNoQuotes = normalizedSlug.replace(/['"’`]/g, '');
    const slugWithAnd = normalizedSlug.replace(/&/g, 'and');
    const slugNoQuotesWithAnd = slugNoQuotes.replace(/&/g, 'and');
    const slugWithoutAmp = normalizedSlug.replace(/&/g, '');
    const slugCleanAlphanumeric = slugNoQuotesWithAnd.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    const candidateSlugs = Array.from(new Set([
        normalizedSlug,
        cleanSlug.toLowerCase(),
        slugNoQuotes,
        slugWithAnd,
        slugNoQuotesWithAnd,
        slugWithoutAmp,
        slugCleanAlphanumeric
    ]));

    try {
        // 1. Look up existing content by slug variants (including 'and' instead of '&', without apostrophes, etc.)
        const placeholders = candidateSlugs.map(() => '?').join(', ');
        const [existing] = await pool.query(
            `SELECT * FROM contents WHERE LOWER(slug) IN (${placeholders}) LIMIT 1`,
            candidateSlugs
        );

        if (existing && existing.length > 0) {
            return existing[0];
        }

        // 1b. Fallback: search by prefix pattern if not found
        if (slugCleanAlphanumeric.length >= 10) {
            const searchKey = `%${slugCleanAlphanumeric.slice(0, 30)}%`;
            const [fuzzy] = await pool.query(
                `SELECT * FROM contents WHERE slug LIKE ? OR title LIKE ? LIMIT 1`,
                [searchKey, searchKey]
            );
            if (fuzzy && fuzzy.length > 0) {
                return fuzzy[0];
            }
        }

        // 2. Read metadata from folder (landing.json or index.html)
        const landingPagesRoot = getLandingPagesRoot();
        let pageDir = path.resolve(landingPagesRoot, cleanSlug);

        // If folder path with cleanSlug doesn't exist, search directory ignoring quotes/case/ampersands
        if (!fs.existsSync(pageDir)) {
            try {
                const allFolders = fs.readdirSync(landingPagesRoot, { withFileTypes: true })
                    .filter(d => d.isDirectory())
                    .map(d => d.name);
                const matchedFolder = allFolders.find(f => {
                    const fNorm = f.toLowerCase().replace(/['"’`]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
                    const sNorm = cleanSlug.toLowerCase().replace(/['"’`]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
                    return fNorm === sNorm;
                });
                if (matchedFolder) {
                    pageDir = path.resolve(landingPagesRoot, matchedFolder);
                }
            } catch (e) {}
        }

        let title = '';
        let webhookUrl = '';
        let redirectUrl = '';

        // Check landing.json
        const metaPath = path.join(pageDir, 'landing.json');
        if (fs.existsSync(metaPath)) {
            try {
                const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
                if (meta.title) title = meta.title;
                if (meta.webhook_url || meta.apiUrl) webhookUrl = meta.webhook_url || meta.apiUrl;
                if (meta.redirect_url || meta.page_url || meta.thank_you_url) redirectUrl = meta.redirect_url || meta.page_url || meta.thank_you_url;
            } catch (e) {}
        }

        // Check index.html for title or inputs if not yet found
        const indexPath = path.join(pageDir, 'index.html');
        if (fs.existsSync(indexPath)) {
            try {
                const html = fs.readFileSync(indexPath, 'utf8');
                if (!title) {
                    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
                    if (titleMatch && titleMatch[1]) {
                        title = titleMatch[1].trim();
                    }
                }
                if (!webhookUrl) {
                    const whMatch = html.match(/name=["'](?:webhook_url|apiUrl)["'][^>]*value=["']([^"']+)["']/i) ||
                                    html.match(/value=["']([^"']+)["'][^>]*name=["'](?:webhook_url|apiUrl)["']/i);
                    if (whMatch && whMatch[1]) webhookUrl = whMatch[1].trim();
                }
                if (!redirectUrl) {
                    const puMatch = html.match(/name=["'](?:page_url|redirect_url|thank_you_url)["'][^>]*value=["']([^"']+)["']/i) ||
                                    html.match(/value=["']([^"']+)["'][^>]*name=["'](?:page_url|redirect_url|thank_you_url)["']/i);
                    if (puMatch && puMatch[1]) redirectUrl = puMatch[1].trim();
                }
            } catch (e) {}
        }

        // Fallbacks from extraContext (e.g. submitted form payload)
        if (extraContext) {
            if (!webhookUrl) webhookUrl = extraContext.webhook_url || extraContext.apiUrl || '';
            if (!redirectUrl) redirectUrl = extraContext.page_url || extraContext.redirect_url || extraContext.thank_you_url || '';
            if (!title && extraContext.campaign_name) title = extraContext.campaign_name;
        }

        if (!title) {
            title = cleanSlug.replace(/['"’`]/g, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }
        if (!webhookUrl) {
            webhookUrl = process.env.DEFAULT_WEBHOOK_URL || 'https://prod-relay.herokuapp.com/api/relay';
        }

        // Safe DB slug (replace & with and, strip quotes)
        const dbSlug = slugCleanAlphanumeric || slugNoQuotesWithAnd.replace(/\s+/g, '-').replace(/[^a-z0-9\-_]/g, '');

        // 3. Insert newly auto-provisioned content row into `contents`
        const [insertRes] = await pool.query(
            `INSERT INTO contents (title, slug, content_type_id, category_id, status, webhook_url, redirect_url, content, builder_layout)
             VALUES (?, ?, 10, 1, 'published', ?, ?, ?, ?)`,
            [
                title,
                dbSlug,
                webhookUrl || null,
                redirectUrl || null,
                `<p>File-based landing page: ${title}</p>`,
                JSON.stringify(['file-landing'])
            ]
        );

        console.log(`[LandingPageHelper] Auto-created content record #${insertRes.insertId} for slug '${cleanSlug}' (dbSlug: ${dbSlug})`);
        
        const [rows] = await pool.query('SELECT * FROM contents WHERE id = ?', [insertRes.insertId]);
        return rows[0] || null;
    } catch (insertErr) {
        console.error(`[LandingPageHelper] Error in getOrCreateContentForLandingPage for '${cleanSlug}':`, insertErr.message);
        // In case of duplicate key or race condition, query by dbSlug and all candidate slugs
        try {
            const dbSlug = slugCleanAlphanumeric || slugNoQuotesWithAnd.replace(/\s+/g, '-').replace(/[^a-z0-9\-_]/g, '');
            const allQuerySlugs = Array.from(new Set([dbSlug, ...candidateSlugs]));
            const placeholders = allQuerySlugs.map(() => '?').join(', ');
            const [retryRows] = await pool.query(
                `SELECT * FROM contents WHERE slug = ? OR LOWER(slug) IN (${placeholders}) LIMIT 1`,
                [dbSlug, ...allQuerySlugs]
            );
            if (retryRows && retryRows[0]) {
                const found = retryRows[0];
                if (!found.builder_layout || !found.builder_layout.includes('file-landing')) {
                    await pool.query(
                        `UPDATE contents SET builder_layout = '["file-landing"]' WHERE id = ?`,
                        [found.id]
                    ).catch(() => {});
                    found.builder_layout = JSON.stringify(['file-landing']);
                }
                return found;
            }
            return null;
        } catch (e) {
            return null;
        }
    }
}

/**
 * Scans backend/landing-pages directory and ensures every landing page folder has
 * an auto-provisioned row in `contents` table with builder_layout = '["file-landing"]'.
 */
async function syncAllFileLandingPages() {
    try {
        const root = getLandingPagesRoot();
        if (!fs.existsSync(root)) return [];

        const entries = fs.readdirSync(root, { withFileTypes: true });
        const results = [];

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            const folderName = entry.name;
            const indexPath = path.join(root, folderName, 'index.html');
            if (fs.existsSync(indexPath)) {
                try {
                    const row = await getOrCreateContentForLandingPage(folderName);
                    if (row) results.push(row);
                } catch (err) {
                    console.warn(`[LandingPageHelper] sync error for ${folderName}:`, err.message);
                }
            }
        }

        // Also ensure any content records representing file-based landing pages have builder_layout set
        await pool.query(
            `UPDATE contents 
             SET builder_layout = '["file-landing"]' 
             WHERE (content LIKE '%File-based landing page%') 
               AND (builder_layout IS NULL OR builder_layout = '' OR builder_layout = 'null')`
        ).catch(() => {});

        console.log(`[LandingPageHelper] Synced ${results.length} file landing page(s) successfully.`);
        return results;
    } catch (e) {
        console.error('[LandingPageHelper] Error in syncAllFileLandingPages:', e.message);
        return [];
    }
}

module.exports = {
    getLandingPagesRoot,
    isValidSlug,
    getFileLandingPageUrl,
    getMimeType,
    getOrCreateContentForLandingPage,
    syncAllFileLandingPages,
    EXT_MIME_MAP
};

