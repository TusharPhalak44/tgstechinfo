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

    // 1. Comprehensive Static Core Pages matching App.jsx routes
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
        { loc: `${baseUrl}/authors`, priority: '0.85', changefreq: 'weekly', lastmod: nowIso },
        { loc: `${baseUrl}/authors/users`, priority: '0.75', changefreq: 'weekly', lastmod: nowIso },
        { loc: `${baseUrl}/authors/admin`, priority: '0.75', changefreq: 'weekly', lastmod: nowIso },
        { loc: `${baseUrl}/audience`, priority: '0.85', changefreq: 'weekly', lastmod: nowIso },
        { loc: `${baseUrl}/audience-intelligence`, priority: '0.85', changefreq: 'weekly', lastmod: nowIso },
        { loc: `${baseUrl}/about`, priority: '0.8', changefreq: 'monthly', lastmod: nowIso },
        { loc: `${baseUrl}/contact`, priority: '0.8', changefreq: 'monthly', lastmod: nowIso },
        { loc: `${baseUrl}/newsletter`, priority: '0.7', changefreq: 'monthly', lastmod: nowIso },
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
        { loc: `${baseUrl}/contact-privacy-officer`, priority: '0.5', changefreq: 'monthly', lastmod: nowIso },
        { loc: `${baseUrl}/user-account-policy`, priority: '0.5', changefreq: 'monthly', lastmod: nowIso }
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
            // Format: (id, 'Name', 'slug', 'type', ...)
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

    // 3. Authors from phase5_pre_migration_backup_20260926.sql
    if (fs.existsSync(catDumpPath)) {
        const userSql = fs.readFileSync(catDumpPath, 'utf8');
        const userMatch = userSql.match(/INSERT INTO `users` VALUES\s*([\s\S]*?);/);
        if (userMatch) {
            const rawUsers = userMatch[1];
            const userRegex = /\((\d+),\s*'([^']*)',\s*'([^']*)'/g;
            let um;
            let authorCount = 0;
            while ((um = userRegex.exec(rawUsers)) !== null) {
                const id = parseInt(um[1], 10);
                const firstName = um[2];
                const lastName = um[3];
                const authorSlug = slugify(`${firstName || ''} ${lastName || ''}`);
                const loc = authorSlug
                    ? `${baseUrl}/author/${id}/${authorSlug}`
                    : `${baseUrl}/author/${id}`;

                urlsMap.set(loc, {
                    loc,
                    lastmod: nowIso,
                    changefreq: 'monthly',
                    priority: '0.6'
                });
                authorCount++;
            }
            console.log(`Loaded ${authorCount} author profile URLs from users table`);
        }
    }

    // 4. Published Content from live_contents.sql (parse ALL rows)
    const contentSqlPath = path.resolve(__dirname, '../database/live_contents.sql');
    if (fs.existsSync(contentSqlPath)) {
        const contentLines = fs.readFileSync(contentSqlPath, 'utf8').split(/\r?\n/);
        let count = 0;

        for (const line of contentLines) {
            const trimmed = line.trim();
            // Match every row starting with (id, user_id, content_type_id, category_id, 'title', 'slug', ...
            const m = trimmed.match(/^\((\d+),\s*(\d+|NULL),\s*(\d+|NULL),\s*(\d+|NULL),\s*'((?:\\.|[^'])*)',\s*'((?:\\.|[^'])*)'/);
            if (m) {
                const id = parseInt(m[1], 10);
                const contentTypeId = m[3] !== 'NULL' ? parseInt(m[3], 10) : 2;
                const categoryId = m[4] !== 'NULL' ? parseInt(m[4], 10) : null;
                const slug = m[6].replace(/\\'/g, "'").trim();

                // Check if published or approved (ignore drafts)
                const isPublished = trimmed.includes("'published'") || trimmed.includes("'approved'") || !trimmed.includes("'draft'");
                if (!isPublished || !slug) continue;

                const category = categoryId ? categoriesMap.get(categoryId) : null;
                const catSlug = category ? category.slug : '';
                const type = CONTENT_TYPE_ROUTE_MAP[contentTypeId] || 'article';

                let itemLoc;
                if (trimmed.includes('file-landing') || trimmed.includes('/lp/')) {
                    itemLoc = `${baseUrl}/lp/${encodeURIComponent(slug)}`;
                } else if (trimmed.includes('[\"html\"]') || trimmed.includes('[\'html\']')) {
                    itemLoc = `${baseUrl}/content/${encodeURIComponent(slug)}`;
                } else if (type === 'event' || contentTypeId === 5) {
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

                // Try to extract updated_at or published_date
                const dateMatches = trimmed.match(/'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})'/g);
                let lastmod = nowIso;
                if (dateMatches && dateMatches.length > 0) {
                    const lastDate = dateMatches[dateMatches.length - 1].replace(/'/g, '');
                    lastmod = formatW3CDate(lastDate);
                }

                urlsMap.set(itemLoc, {
                    loc: itemLoc,
                    lastmod,
                    changefreq,
                    priority
                });
                count++;
            }
        }
        console.log(`Parsed ${count} published content items from live_contents.sql`);
    }

    // 5. Merge existing URLs from commit 3e0d105 / disk so newly created articles are preserved
    try {
        const cp = require('child_process');
        let rawXml = '';
        try {
            rawXml = cp.execSync('git show 3e0d105:frontend/public/sitemap.xml', { stdio: ['pipe', 'pipe', 'ignore'] }).toString('utf8');
        } catch (_) {}
        if (!rawXml && fs.existsSync(path.resolve(__dirname, '../../frontend/public/sitemap.xml'))) {
            rawXml = fs.readFileSync(path.resolve(__dirname, '../../frontend/public/sitemap.xml'), 'utf8');
        }
        if (rawXml) {
            const urlBlockRegex = /<url>([\s\S]*?)<\/url>/g;
            let match;
            let mergedCount = 0;
            while ((match = urlBlockRegex.exec(rawXml)) !== null) {
                const block = match[1];
                const locM = block.match(/<loc>(https:\/\/tgstechinfo\.com\/[^<]+)<\/loc>/);
                if (locM) {
                    const loc = locM[1];
                    if (!urlsMap.has(loc)) {
                        const lastmodM = block.match(/<lastmod>([^<]+)<\/lastmod>/);
                        const changefreqM = block.match(/<changefreq>([^<]+)<\/changefreq>/);
                        const priorityM = block.match(/<priority>([^<]+)<\/priority>/);
                        urlsMap.set(loc, {
                            loc,
                            lastmod: lastmodM ? lastmodM[1] : nowIso,
                            changefreq: changefreqM ? changefreqM[1] : 'weekly',
                            priority: priorityM ? priorityM[1] : '0.75'
                        });
                        mergedCount++;
                    }
                }
            }
            console.log(`Preserved ${mergedCount} additional existing URLs from sitemap baseline`);
        }
    } catch (err) {
        console.warn('Notice preserving baseline URLs:', err.message);
    }

    // Build XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n';
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
        const dir = path.dirname(p);
        if (fs.existsSync(dir)) {
            fs.writeFileSync(p, xml, 'utf8');
            console.log(`✅ Written ${urlsMap.size} URLs to ${p}`);
        }
    }

    return { totalUrls: urlsMap.size };
}

run().catch(err => {
    console.error('Error generating sitemap:', err);
    process.exit(1);
});
