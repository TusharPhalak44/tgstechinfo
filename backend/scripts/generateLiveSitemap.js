/**
 * TGSTechInfo Live Sitemap Generator
 * Connects directly to the live MySQL database and generates an exhaustive,
 * 100% up-to-date sitemap.xml with all published content up to today.
 *
 * Usage:
 *   node backend/scripts/generateLiveSitemap.js
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');
const SitemapService = require('../src/services/sitemapService');

async function run() {
    console.log('====================================================');
    console.log('🔄 TGSTechInfo Live Sitemap Generator');
    console.log(`📅 Execution Date: ${new Date().toISOString()}`);
    console.log('====================================================');

    try {
        console.log('⏳ Connecting to MySQL database...');
        const [testDb] = await pool.query('SELECT 1 as connected');
        console.log('✅ Connected to MySQL successfully!');

        // Query database statistics
        const [[{ count: publishedContentCount }]] = await pool.query(`
            SELECT count(*) as count FROM contents
            WHERE (status = 'published' OR status = 'approved' OR LOWER(status) = 'published')
              AND (is_visible_on_site = 1 OR is_visible_on_site IS NULL)
              AND (scheduled_publish_date IS NULL OR scheduled_publish_date <= CURRENT_TIMESTAMP)
              AND slug IS NOT NULL AND TRIM(slug) != ''
        `);

        const [[{ count: eventCount }]] = await pool.query(`
            SELECT count(*) as count FROM events WHERE status = 'published'
        `);

        const [[{ count: categoryCount }]] = await pool.query(`
            SELECT count(*) as count FROM categories WHERE slug IS NOT NULL AND TRIM(slug) != ''
        `);

        const [[{ count: authorCount }]] = await pool.query(`
            SELECT count(DISTINCT u.id) as count FROM users u
            JOIN contents c ON c.user_id = u.id AND c.status = 'published'
        `);

        console.log(`📊 Live Database Statistics:`);
        console.log(`   - Published Articles/Contents: ${publishedContentCount}`);
        console.log(`   - Published Events/Webinars:   ${eventCount}`);
        console.log(`   - Active Categories:           ${categoryCount}`);
        console.log(`   - Authors with Content:        ${authorCount}`);

        console.log('\n⏳ Generating XML Sitemap with XSL stylesheet...');
        const { xml, totalUrls } = await SitemapService.generateSitemapXml();

        // Target write paths
        const targetPaths = [
            path.resolve(__dirname, '../../frontend/public/sitemap.xml'),
            path.resolve(__dirname, '../../frontend/dist/sitemap.xml'),
            path.resolve(process.cwd(), 'frontend/public/sitemap.xml'),
            path.resolve(process.cwd(), 'frontend/dist/sitemap.xml'),
            path.resolve(process.cwd(), '../frontend/public/sitemap.xml'),
            path.resolve(process.cwd(), '../frontend/dist/sitemap.xml'),
            '/usr/share/nginx/html/sitemap.xml'
        ];

        let writtenCount = 0;
        const tried = new Set();
        for (const p of targetPaths) {
            if (tried.has(p)) continue;
            tried.add(p);
            const dir = path.dirname(p);
            if (fs.existsSync(dir)) {
                try {
                    fs.writeFileSync(p, xml, 'utf8');
                    console.log(`   ✅ Written to: ${p}`);
                    writtenCount++;
                } catch (err) {
                    console.warn(`   ⚠️ Notice writing to ${p}:`, err.message);
                }
            }
        }

        console.log('\n====================================================');
        console.log(`🎉 SUCCESS: Generated complete sitemap with ${totalUrls} total URLs!`);
        console.log(`📁 Updated ${writtenCount} file location(s).`);
        console.log('====================================================\n');

    } catch (err) {
        console.error('❌ Error during live sitemap generation:', err.message);
    } finally {
        try {
            await pool.end();
        } catch (_) {}
        process.exit(0);
    }
}

run();
