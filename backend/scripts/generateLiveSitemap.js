/**
 * Live Sitemap Generator Script
 * Connects directly to the active MySQL database (configured in .env)
 * and generates the complete, dynamic sitemap with all 1100+ contents.
 *
 * Usage:
 *   node backend/scripts/generateLiveSitemap.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const SitemapService = require('../src/services/sitemapService');
const { pool } = require('../src/config/database');

async function main() {
    console.log('[SitemapGenerator] Connecting to active database to generate live sitemap...');
    console.log(`[SitemapGenerator] Target DB Host: ${process.env.DB_HOST || 'localhost'}, DB: ${process.env.DB_NAME}`);

    try {
        const result = await SitemapService.syncSitemapFile();
        if (result.success) {
            console.log(`✅ Success! Generated sitemap with ${result.totalUrls} live URLs written to ${result.writtenCount} locations.`);
        } else {
            console.error('❌ Failed to generate sitemap:', result.error);
        }
    } catch (err) {
        console.error('❌ Execution error:', err.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

main();

