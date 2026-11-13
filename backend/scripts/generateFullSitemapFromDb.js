const fs = require('fs');
const path = require('path');

// Content type route mapping matching frontend/src/lib/contentRoute.js
const CONTENT_TYPE_ROUTE_MAP = {
    1: 'news',
    2: 'article',
    3: 'blog',
    4: 'webinar',
    5: 'event',
    6: 'interview',
    7: 'ebook',
    8: 'article', // guide
    9: 'report',
    10: 'whitepaper',
    11: 'case-study'
};

const TYPE_NAME_MAP = {
    news: 'news',
    article: 'article',
    articles: 'article',
    blog: 'blog',
    blogs: 'blog',
    webinar: 'webinar',
    webinars: 'webinar',
    event: 'event',
    events: 'event',
    interview: 'interview',
    interviews: 'interview',
    ebook: 'ebook',
    ebooks: 'ebook',
    whitepaper: 'whitepaper',
    whitepapers: 'whitepaper',
    'case-study': 'case-study',
    'case-studies': 'case-study',
    casestudy: 'case-study',
    report: 'report',
    reports: 'report',
    'landing-page': 'article'
};

function slugify(name) {
    if (!name) return '';
    return String(name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function escapeXml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function formatW3CDate(d) {
    if (!d) return new Date().toISOString();
    try {
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return new Date().toISOString();
        return dt.toISOString();
    } catch {
        return new Date().toISOString();
    }
}

async function run() {
    const baseUrl = 'https://tgstechinfo.com';
    const nowIso = new Date().toISOString();
    const urlsMap = new Map();

    // 1. Static Core Pages
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

    for (const p of staticPages) {
        urlsMap.set(p.loc, p);
    }

    // 2. Categories mapping
    const categoriesMap = new Map();
    const catDumpPath = path.resolve(__dirname, '../database/backups/phase5_pre_migration_backup_20260926.sql');
    if (fs.existsSync(catDumpPath)) {
        const catSql = fs.readFileSync(catDumpPath, 'utf8');
        const catMatch = catSql.match(/INSERT INTO `categories` VALUES\s*([\s\S]*?);/);
        if (catMatch) {
            const raw = catMatch[1];
            // Format: (1,'Technology','technology','technology',NULL,'2026-07-01 13:02:23')
            const catRegex = /\((\d+),\s*'([^']*)',\s*'([^']*)'/g;
            let cm;
            while ((cm = catRegex.exec(raw)) !== null) {
                const id = parseInt(cm[1], 10);
                const name = cm[2];
                const slug = slugify(cm[3]);
                categoriesMap.set(id, { id, name, slug });

                const catLoc = `${baseUrl}/category/${slug}`;
                urlsMap.set(catLoc, {
                    loc: catLoc,
                    lastmod: nowIso,
                    changefreq: 'weekly',
                    priority: '0.8'
                });
            }
        }
    }
    console.log(`Loaded ${categoriesMap.size} categories`);

    // 3. Published Content from live_contents.sql
    const contentSqlPath = path.resolve(__dirname, '../database/live_contents.sql');
    if (fs.existsSync(contentSqlPath)) {
        const contentSql = fs.readFileSync(contentSqlPath, 'utf8');
        // Parse INSERT INTO `contents`
        // Columns: (`id`, `user_id`, `content_type_id`, `category_id`, `title`, `slug`, ..., `status`, ...)
        // We match each row block:
        // Format: (id, user_id, content_type_id, category_id, 'title', 'slug', ... 'status', ... 'is_visible_on_site', ...)
        const rowRegex = /\((\d+),\s*(\d+|NULL),\s*(\d+|NULL),\s*(\d+|NULL),\s*'((?:\\.|[^'])*)',\s*'((?:\\.|[^'])*)'[\s\S]*?'(published|draft|pending|review|changes_requested|rejected)'/g;
        let rm;
        let count = 0;
        while ((rm = rowRegex.exec(contentSql)) !== null) {
            const id = parseInt(rm[1], 10);
            const contentTypeId = rm[3] !== 'NULL' ? parseInt(rm[3], 10) : 2;
            const categoryId = rm[4] !== 'NULL' ? parseInt(rm[4], 10) : null;
            const title = rm[5].replace(/\\'/g, "'");
            const slug = rm[6].replace(/\\'/g, "'").trim();
            const status = rm[7];

            if (status !== 'published' || !slug) continue;

            const category = categoryId ? categoriesMap.get(categoryId) : null;
            const catSlug = category ? category.slug : '';
            const type = CONTENT_TYPE_ROUTE_MAP[contentTypeId] || 'article';

            let itemLoc;
            if (type === 'event' || contentTypeId === 5) {
                itemLoc = `${baseUrl}/events/${encodeURIComponent(slug)}`;
            } else if (type === 'case-study' || contentTypeId === 11) {
                itemLoc = catSlug
                    ? `${baseUrl}/case-study/${encodeURIComponent(catSlug)}/${encodeURIComponent(slug)}`
                    : `${baseUrl}/case-study/${encodeURIComponent(slug)}`;
            } else if (catSlug) {
                itemLoc = `${baseUrl}/${type}/${encodeURIComponent(catSlug)}/${encodeURIComponent(slug)}`;
            } else {
                itemLoc = `${baseUrl}/${type}/${encodeURIComponent(slug)}`;
            }

            let priority = '0.75';
            let changefreq = 'weekly';
            if (type === 'news') { priority = '0.85'; changefreq = 'daily'; }
            else if (type === 'article' || type === 'blog') { priority = '0.8'; changefreq = 'weekly'; }

            urlsMap.set(itemLoc, {
                loc: itemLoc,
                lastmod: nowIso,
                changefreq,
                priority
            });
            count++;
        }
        console.log(`Parsed ${count} published content items from live_contents.sql`);
    }

    // 4. Fallback: Also include author URLs from existing sitemap if present
    const existingSitemapPath = path.resolve(__dirname, '../../frontend/public/sitemap.xml');
    if (fs.existsSync(existingSitemapPath)) {
        const existingXml = fs.readFileSync(existingSitemapPath, 'utf8');
        const authorRegex = /<loc>(https:\/\/tgstechinfo\.com\/author\/[^<]+)<\/loc>/g;
        let am;
        let aCount = 0;
        while ((am = authorRegex.exec(existingXml)) !== null) {
            const loc = am[1];
            if (!urlsMap.has(loc)) {
                urlsMap.set(loc, {
                    loc,
                    lastmod: nowIso,
                    changefreq: 'monthly',
                    priority: '0.6'
                });
                aCount++;
            }
        }
        console.log(`Retained ${aCount} author profile URLs`);
    }

    // Build XML
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

    const targetPaths = [
        path.resolve(__dirname, '../../frontend/public/sitemap.xml'),
        path.resolve(__dirname, '../../frontend/dist/sitemap.xml')
    ];

    for (const p of targetPaths) {
        fs.writeFileSync(p, xml, 'utf8');
        console.log(`✅ Written ${urlsMap.size} URLs to ${p}`);
    }
}

run().catch(err => {
    console.error('Error generating sitemap:', err);
    process.exit(1);
});

