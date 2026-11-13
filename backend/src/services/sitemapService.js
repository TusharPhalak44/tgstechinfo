const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');

// Content type route mapping matching frontend/src/lib/contentRoute.js
const CONTENT_TYPE_ROUTE_MAP = {
    articles: 'article',
    article: 'article',
    blogs: 'blog',
    blog: 'blog',
    news: 'news',
    webinars: 'webinar',
    webinar: 'webinar',
    events: 'event',
    event: 'event',
    whitepapers: 'whitepaper',
    whitepaper: 'whitepaper',
    'white-paper': 'whitepaper',
    ebooks: 'ebook',
    ebook: 'ebook',
    interviews: 'interview',
    interview: 'interview',
    reports: 'report',
    report: 'report',
    'case-study': 'case-study',
    'case study': 'case-study',
    'case-studies': 'case-study',
    casestudy: 'case-study',
    'landing-page': 'article',
    'landing page': 'article'
};

// In-memory cache variables
let cachedSitemapXml = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

/**
 * Escape special XML characters for safe inclusion in sitemap
 */
function escapeXml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Format date to valid W3C Datetime string (ISO-8601)
 */
function formatW3CDate(dateVal) {
    if (!dateVal) return new Date().toISOString();
    try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return new Date().toISOString();
        return d.toISOString();
    } catch {
        return new Date().toISOString();
    }
}

/**
 * Clean slug helper
 */
function slugify(name) {
    if (!name) return '';
    return String(name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Resolve canonical URL for a content item based on its type and layout
 */
function resolveItemUrl(baseUrl, item) {
    const slug = (item.slug || '').trim();
    if (!slug) return null;

    // Check if file-based landing page
    const rawUrl = typeof item.redirect_url === 'string' ? item.redirect_url.trim() : (typeof item.url === 'string' ? item.url.trim() : '');
    let parsedLayout = null;
    if (item.builder_layout) {
        try {
            parsedLayout = typeof item.builder_layout === 'string' ? JSON.parse(item.builder_layout) : item.builder_layout;
        } catch { }
    }
    const isFileLanding = Boolean(
        item.is_file_landing_page ||
        (Array.isArray(parsedLayout) && (parsedLayout.includes('file-landing') || parsedLayout[0] === 'file-landing')) ||
        (typeof item.builder_layout === 'string' && item.builder_layout.includes('file-landing')) ||
        (typeof item.content === 'string' && item.content.includes('File-based landing page')) ||
        (rawUrl && (rawUrl.startsWith('/lp/') || rawUrl.includes('/lp/')))
    );

    if (isFileLanding) {
        const targetSlug = slug || (rawUrl ? rawUrl.replace(/^\/lp\//, '') : '');
        return `${baseUrl}/lp/${encodeURIComponent(targetSlug)}`;
    }

    // Check if standalone HTML builder landing page
    const isHtmlBuilder = Array.isArray(parsedLayout) && parsedLayout[0] === 'html';
    const isLandingPageType = ['landing-page', 'landing page'].includes((item.content_type || item.content_type_name || '').toLowerCase().trim());
    if (isHtmlBuilder || isLandingPageType) {
        return `${baseUrl}/content/${encodeURIComponent(slug)}`;
    }

    const type = CONTENT_TYPE_ROUTE_MAP[String(item.content_type || item.content_type_name || 'article').toLowerCase().trim()] || 'article';

    if (type === 'event' || item.content_type_id === 5) {
        return `${baseUrl}/events/${encodeURIComponent(slug)}`;
    }

    if (type === 'case-study') {
        const catSlug = slugify(item.category_slug || item.category_name || '');
        if (catSlug) {
            return `${baseUrl}/case-study/${encodeURIComponent(catSlug)}/${encodeURIComponent(slug)}`;
        }
        return `${baseUrl}/case-study/${encodeURIComponent(slug)}`;
    }

    const catSlug = slugify(item.category_slug || item.category_name || '');
    if (catSlug) {
        return `${baseUrl}/${type}/${encodeURIComponent(catSlug)}/${encodeURIComponent(slug)}`;
    }
    return `${baseUrl}/${type}/${encodeURIComponent(slug)}`;
}

class SitemapService {
    /**
     * Get the base URL from environment or fallback to default
     */
    static getBaseUrl() {
        let base = process.env.BASE_URL || process.env.SITE_URL || 'https://tgstechinfo.com';
        // Strip trailing slash if present
        return base.replace(/\/+$/, '');
    }

    /**
     * Invalidate in-memory cache
     */
    static invalidateCache() {
        cachedSitemapXml = null;
        lastCacheTime = 0;
        console.log('[SitemapService] Cache invalidated');
    }

    /**
     * Generates a complete XML sitemap dynamically from the database
     */
    static async generateSitemapXml() {
        const baseUrl = this.getBaseUrl();
        const nowIso = new Date().toISOString();

        // Use a Map keyed by URL location to prevent duplicates
        const urlsMap = new Map();

        // 1. Static Core Pages with SEO priorities & change frequencies
        const staticPages = [
            { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily', lastmod: nowIso },
            { loc: `${baseUrl}/articles`, priority: '0.9', changefreq: 'daily', lastmod: nowIso },
            { loc: `${baseUrl}/blogs`, priority: '0.9', changefreq: 'daily', lastmod: nowIso },
            { loc: `${baseUrl}/news`, priority: '0.9', changefreq: 'daily', lastmod: nowIso },
            { loc: `${baseUrl}/interviews`, priority: '0.9', changefreq: 'weekly', lastmod: nowIso },
            { loc: `${baseUrl}/webinars`, priority: '0.9', changefreq: 'weekly', lastmod: nowIso },
            { loc: `${baseUrl}/events`, priority: '0.9', changefreq: 'weekly', lastmod: nowIso },
            { loc: `${baseUrl}/ebooks`, priority: '0.9', changefreq: 'weekly', lastmod: nowIso },
            { loc: `${baseUrl}/whitepapers`, priority: '0.9', changefreq: 'weekly', lastmod: nowIso },
            { loc: `${baseUrl}/case-studies`, priority: '0.9', changefreq: 'weekly', lastmod: nowIso },
            { loc: `${baseUrl}/landing-pages`, priority: '0.8', changefreq: 'weekly', lastmod: nowIso },
            { loc: `${baseUrl}/authors`, priority: '0.8', changefreq: 'weekly', lastmod: nowIso },
            { loc: `${baseUrl}/audience`, priority: '0.85', changefreq: 'weekly', lastmod: nowIso },
            { loc: `${baseUrl}/audience-intelligence`, priority: '0.85', changefreq: 'weekly', lastmod: nowIso },
            { loc: `${baseUrl}/about`, priority: '0.8', changefreq: 'monthly', lastmod: nowIso },
            { loc: `${baseUrl}/contact`, priority: '0.8', changefreq: 'monthly', lastmod: nowIso },
            { loc: `${baseUrl}/privacy-policy`, priority: '0.5', changefreq: 'monthly', lastmod: nowIso },
            { loc: `${baseUrl}/terms-of-use`, priority: '0.5', changefreq: 'monthly', lastmod: nowIso },
            { loc: `${baseUrl}/cookie-policy`, priority: '0.5', changefreq: 'monthly', lastmod: nowIso },
            { loc: `${baseUrl}/data-privacy-notice`, priority: '0.5', changefreq: 'monthly', lastmod: nowIso },
            { loc: `${baseUrl}/data-requests`, priority: '0.5', changefreq: 'monthly', lastmod: nowIso },
            { loc: `${baseUrl}/disclaimer`, priority: '0.5', changefreq: 'monthly', lastmod: nowIso },
            { loc: `${baseUrl}/accessibility`, priority: '0.5', changefreq: 'monthly', lastmod: nowIso },
            { loc: `${baseUrl}/acceptable-use`, priority: '0.5', changefreq: 'monthly', lastmod: nowIso },
            { loc: `${baseUrl}/security`, priority: '0.5', changefreq: 'monthly', lastmod: nowIso },
            { loc: `${baseUrl}/vendor-list`, priority: '0.5', changefreq: 'monthly', lastmod: nowIso },
            { loc: `${baseUrl}/contact-privacy-officer`, priority: '0.5', changefreq: 'monthly', lastmod: nowIso }
        ];

        for (const page of staticPages) {
            urlsMap.set(page.loc, page);
        }

        // 2. Dynamic Categories
        try {
            const [categories] = await pool.query(
                'SELECT id, name, slug, updated_at, created_at FROM categories WHERE slug IS NOT NULL AND TRIM(slug) != "" ORDER BY name ASC'
            );
            for (const cat of categories) {
                const catSlug = slugify(cat.slug);
                if (catSlug) {
                    const loc = `${baseUrl}/category/${catSlug}`;
                    urlsMap.set(loc, {
                        loc,
                        lastmod: formatW3CDate(cat.updated_at || cat.created_at || nowIso),
                        changefreq: 'weekly',
                        priority: '0.8'
                    });
                }
            }
        } catch (catErr) {
            console.warn('[SitemapService] Error fetching categories:', catErr.message);
        }

        // 3. Dynamic Published Content Items (articles, blogs, news, webinars, ebooks, etc.)
        try {
            let contents = [];
            try {
                const [rows] = await pool.query(`
                    SELECT c.id, c.title, c.slug, c.status, c.is_visible_on_site, c.builder_layout,
                           c.redirect_url, c.published_date, c.created_at, c.updated_at,
                           c.content_type_id, c.category_id,
                           c.webinar_date, c.webinar_type,
                           ct.slug AS content_type, ct.name AS content_type_name,
                           cat.slug AS category_slug, cat.name AS category_name
                    FROM contents c
                    LEFT JOIN content_types ct ON c.content_type_id = ct.id
                    LEFT JOIN categories cat ON c.category_id = cat.id
                    WHERE c.status = 'published'
                      AND (c.is_visible_on_site = 1 OR c.is_visible_on_site IS NULL)
                      AND (c.scheduled_publish_date IS NULL OR c.scheduled_publish_date <= CURRENT_TIMESTAMP)
                    ORDER BY COALESCE(c.published_date, c.created_at) DESC
                `);
                contents = rows;
            } catch (queryErr) {
                console.warn('[SitemapService] Primary content query notice, attempting resilient query:', queryErr.message);
                const [fallbackRows] = await pool.query(`
                    SELECT c.id, c.title, c.slug, c.status, c.is_visible_on_site,
                           c.published_date, c.created_at, c.updated_at,
                           c.content_type_id, c.category_id,
                           ct.slug AS content_type, ct.name AS content_type_name,
                           cat.slug AS category_slug, cat.name AS category_name
                    FROM contents c
                    LEFT JOIN content_types ct ON c.content_type_id = ct.id
                    LEFT JOIN categories cat ON c.category_id = cat.id
                    WHERE c.status = 'published'
                      AND (c.is_visible_on_site = 1 OR c.is_visible_on_site IS NULL)
                    ORDER BY COALESCE(c.published_date, c.created_at) DESC
                `);
                contents = fallbackRows;
            }

            for (const item of contents) {
                // Filter out concluded live webinars & events
                const isLiveWebinarOrEvent = (
                    (item.content_type === 'webinar' || item.content_type === 'event' || item.content_type_id === 4 || item.content_type_id === 5) &&
                    (item.webinar_type === 'live' || !item.webinar_type) &&
                    item.webinar_date && new Date(item.webinar_date) < new Date()
                );
                if (isLiveWebinarOrEvent) continue;

                const itemUrl = resolveItemUrl(baseUrl, item);
                if (itemUrl) {
                    const normType = (item.content_type || item.content_type_name || '').toLowerCase();
                    let priority = '0.75';
                    let changefreq = 'weekly';

                    if (normType.includes('news')) {
                        priority = '0.85';
                        changefreq = 'daily';
                    } else if (normType.includes('article') || normType.includes('blog')) {
                        priority = '0.8';
                        changefreq = 'weekly';
                    } else if (normType.includes('landing')) {
                        priority = '0.7';
                        changefreq = 'monthly';
                    }

                    urlsMap.set(itemUrl, {
                        loc: itemUrl,
                        lastmod: formatW3CDate(item.updated_at || item.published_date || item.created_at || nowIso),
                        changefreq,
                        priority
                    });
                }
            }
            console.log(`[SitemapService] Successfully mapped ${urlsMap.size} URLs including dynamic contents`);
        } catch (contentErr) {
            console.warn('[SitemapService] Error fetching contents:', contentErr.message);
        }

        // 4. Dynamic Events from `events` table (in addition to contents table)
        try {
            const [events] = await pool.query(`
                SELECT id, title, slug, status, start_date, created_at, updated_at
                FROM events
                WHERE status = 'published'
                ORDER BY start_date DESC
            `);

            for (const ev of events) {
                const evSlug = (ev.slug || '').trim();
                if (evSlug) {
                    const loc = `${baseUrl}/events/${encodeURIComponent(evSlug)}`;
                    if (!urlsMap.has(loc)) {
                        urlsMap.set(loc, {
                            loc,
                            lastmod: formatW3CDate(ev.updated_at || ev.created_at || nowIso),
                            changefreq: 'weekly',
                            priority: '0.8'
                        });
                    }
                }
            }
        } catch (evErr) {
            console.warn('[SitemapService] Error fetching events:', evErr.message);
        }

        // 5. Active Authors with published articles
        try {
            const [authors] = await pool.query(`
                SELECT u.id, u.first_name, u.last_name, MAX(COALESCE(c.published_date, c.created_at)) AS latest_date
                FROM users u
                JOIN contents c ON c.user_id = u.id AND c.status = 'published' AND (c.is_visible_on_site = 1 OR c.is_visible_on_site IS NULL)
                GROUP BY u.id, u.first_name, u.last_name
            `);

            for (const author of authors) {
                const authorSlug = slugify(`${author.first_name || ''} ${author.last_name || ''}`);
                const loc = authorSlug
                    ? `${baseUrl}/author/${author.id}/${authorSlug}`
                    : `${baseUrl}/author/${author.id}`;

                urlsMap.set(loc, {
                    loc,
                    lastmod: formatW3CDate(author.latest_date || nowIso),
                    changefreq: 'monthly',
                    priority: '0.6'
                });
            }
        } catch (authorErr) {
            console.warn('[SitemapService] Error fetching authors:', authorErr.message);
        }

        // 6. Build the XML String
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        for (const entry of urlsMap.values()) {
            xml += '  <url>\n';
            xml += `    <loc>${escapeXml(entry.loc)}</loc>\n`;
            if (entry.lastmod) {
                xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
            }
            if (entry.changefreq) {
                xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
            }
            if (entry.priority) {
                xml += `    <priority>${entry.priority}</priority>\n`;
            }
            xml += '  </url>\n';
        }

        xml += '</urlset>\n';

        // Update in-memory cache
        cachedSitemapXml = xml;
        lastCacheTime = Date.now();

        return { xml, totalUrls: urlsMap.size };
    }

    /**
     * Get sitemap XML with automatic caching
     */
    static async getSitemapXml(options = {}) {
        const force = Boolean(options.force);
        const isCacheValid = cachedSitemapXml && (Date.now() - lastCacheTime < CACHE_TTL_MS);

        if (!force && isCacheValid) {
            return { xml: cachedSitemapXml, fromCache: true };
        }

        const result = await this.generateSitemapXml();
        return { xml: result.xml, fromCache: false, totalUrls: result.totalUrls };
    }

    /**
     * Syncs and writes the generated sitemap XML to static files on disk
     * Updates frontend/public/sitemap.xml and frontend/dist/sitemap.xml (if dist exists)
     */
    static async syncSitemapFile() {
        try {
            const { xml, totalUrls } = await this.generateSitemapXml();

            // Candidate target paths
            const targetPaths = [
                path.resolve(__dirname, '../../../frontend/public/sitemap.xml'),
                path.resolve(__dirname, '../../../frontend/dist/sitemap.xml'),
                path.resolve(process.cwd(), 'frontend/public/sitemap.xml'),
                path.resolve(process.cwd(), 'frontend/dist/sitemap.xml'),
                path.resolve(process.cwd(), '../frontend/public/sitemap.xml'),
                path.resolve(process.cwd(), '../frontend/dist/sitemap.xml')
            ];

            let writtenCount = 0;
            const triedDirs = new Set();

            for (const targetPath of targetPaths) {
                const dir = path.dirname(targetPath);
                if (triedDirs.has(targetPath)) continue;
                triedDirs.add(targetPath);

                if (fs.existsSync(dir)) {
                    try {
                        await fs.promises.writeFile(targetPath, xml, 'utf8');
                        writtenCount++;
                    } catch (writeErr) {
                        console.warn(`[SitemapService] Could not write to ${targetPath}:`, writeErr.message);
                    }
                }
            }

            console.log(`[SitemapService] Synced sitemap.xml with ${totalUrls} URLs to ${writtenCount} file location(s).`);
            return { success: true, totalUrls, writtenCount };
        } catch (err) {
            console.error('[SitemapService] Error during syncSitemapFile:', err.message);
            return { success: false, error: err.message };
        }
    }

    /**
     * Lifecycle notification: called whenever content/event/category changes.
     * Invalidates the cache and triggers a non-blocking background file sync.
     */
    static notifyContentChanged() {
        this.invalidateCache();
        // Asynchronously update file on disk without blocking caller
        setImmediate(() => {
            this.syncSitemapFile().catch(err => {
                console.warn('[SitemapService] Background file sync warning:', err.message);
            });
        });
    }
}

module.exports = SitemapService;

