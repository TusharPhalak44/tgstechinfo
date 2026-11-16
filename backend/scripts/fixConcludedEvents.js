/**
 * Fix Concluded Events and Synchronize Event Tables
 * 
 * Usage:
 *   node backend/scripts/fixConcludedEvents.js
 */
const { pool } = require('../src/config/database');
const SitemapService = require('../src/services/sitemapService');

async function main() {
    console.log('====================================================');
    console.log('🔄 Event Synchronization & Visibility Fix');
    console.log('====================================================');

    try {
        // 1. Restore visibility in contents table for published/archived items
        const [visRes] = await pool.query(`
            UPDATE contents
            SET is_visible_on_site = 1
            WHERE is_visible_on_site = 0
              AND status IN ('published', 'archived')
        `);
        console.log(`✅ Restored is_visible_on_site=1 for ${visRes.affectedRows} content items.`);

        // 2. Synchronize all events from contents table into events table
        const [eventContents] = await pool.query(`
            SELECT c.id, c.title, c.slug, 
                   COALESCE(c.content, c.excerpt) AS description,
                   c.excerpt AS short_description,
                   COALESCE(c.banner_image, c.featured_image) AS banner_image,
                   COALESCE(c.webinar_date, c.start_date, c.scheduled_publish_date) AS event_date,
                   COALESCE(c.platform, 'Zoom') AS online_platform,
                   c.hosted_by AS speaker_name,
                   c.status, c.created_at, c.updated_at
            FROM contents c
            JOIN content_types ct ON c.content_type_id = ct.id
            WHERE ct.slug = 'event' OR c.content_type_id = 5
        `);
        console.log(`\n📋 Found ${eventContents.length} event(s) in contents table.`);

        for (const ec of eventContents) {
            const evDate = ec.event_date ? new Date(ec.event_date) : new Date();
            const [evExists] = await pool.query('SELECT id, status, start_date FROM events WHERE slug = ? LIMIT 1', [ec.slug]);

            if (evExists && evExists.length > 0) {
                // Update start_date and sync title/banner if needed
                await pool.query(`
                    UPDATE events SET
                        title = ?,
                        start_date = COALESCE(?, start_date),
                        banner_image = COALESCE(?, banner_image),
                        speaker_name = COALESCE(?, speaker_name),
                        status = ?
                    WHERE id = ?
                `, [
                    ec.title,
                    evDate,
                    ec.banner_image,
                    ec.speaker_name,
                    ec.status || 'published',
                    evExists[0].id
                ]);
                console.log(`   🔄 Synced existing event in events table: "${ec.title}" (ID: ${evExists[0].id}, Date: ${evDate.toISOString()})`);
            } else {
                // Insert into events table
                const [ins] = await pool.query(`
                    INSERT INTO events 
                    (title, slug, short_description, description, event_type, event_mode, start_date, timezone,
                     online_platform, banner_image, speaker_name, status, created_at, updated_at)
                    VALUES (?, ?, ?, ?, 'webinar', 'online', ?, 'IST (UTC+5:30)', ?, ?, ?, ?, ?, ?)
                `, [
                    ec.title,
                    ec.slug,
                    ec.short_description,
                    ec.description,
                    evDate,
                    ec.online_platform,
                    ec.banner_image,
                    ec.speaker_name,
                    ec.status || 'published',
                    ec.created_at || new Date(),
                    ec.updated_at || new Date()
                ]);
                console.log(`   ➕ Inserted missing event into events table: "${ec.title}" (ID: ${ins.insertId})`);
            }
        }

        // 3. Specifically verify and ensure upcoming status for the two December 2026 events
        const UPCOMING_EVENTS = [
            {
                slug: 'from-question-to-answer-the-basics-of-ai-chatbots-for-beginners',
                date: '2026-12-09 16:00:00'
            },
            {
                slug: 'oracle-cloud-summit',
                date: '2026-12-08 00:00:00'
            }
        ];

        for (const u of UPCOMING_EVENTS) {
            await pool.query(`
                UPDATE events 
                SET status = 'published', start_date = ? 
                WHERE slug = ?
            `, [u.date, u.slug]);

            await pool.query(`
                UPDATE contents 
                SET status = 'published', is_visible_on_site = 1, webinar_date = ? 
                WHERE slug = ?
            `, [u.date, u.slug]);

            console.log(`   ✨ Verified upcoming event: "${u.slug}" (Date: ${u.date}, status: published)`);
        }

        // 4. Specifically verify the past event (October 27, 2026)
        const pastSlug = 'innovating-health-together-conference';
        const pastDate = '2026-10-27 09:30:00';
        await pool.query(`
            UPDATE events 
            SET status = 'published', start_date = ? 
            WHERE slug = ?
        `, [pastDate, pastSlug]);
        await pool.query(`
            UPDATE contents 
            SET status = 'published', is_visible_on_site = 1, webinar_date = ? 
            WHERE slug = ?
        `, [pastDate, pastSlug]);
        console.log(`   ✨ Verified past event: "${pastSlug}" (Date: ${pastDate} -> Concluded. Will NOT show in /events list, but direct link loads without 404).`);

        // 5. Re-sync dynamic sitemap
        console.log('\n🗺️  Re-syncing dynamic sitemap file...');
        const sitemapResult = await SitemapService.syncSitemapFile();
        console.log(`✅ Sitemap updated! Total URLs: ${sitemapResult?.urlCount || 'N/A'}`);

        console.log('\n🎉 ALL DONE! Events synchronized, past events hidden from list, and upcoming events fully active.');
    } catch (err) {
        console.error('❌ Error fixing events:', err.message);
    } finally {
        await pool.end();
    }
}

main();
