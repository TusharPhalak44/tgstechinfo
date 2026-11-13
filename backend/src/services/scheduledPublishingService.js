const { pool } = require('../config/database');

class ScheduledPublishingService {
    /**
     * Finds all contents that have been approved or scheduled whose scheduled_publish_date has arrived,
     * and automatically transitions them to 'published' status with real-time subscriber notifications.
     */
    static async checkAndPublishDueContent() {
        try {
            let dueItems;
            try {
                [dueItems] = await pool.query(`
                    SELECT id, title, slug, user_id, scheduled_publish_date 
                    FROM contents 
                    WHERE (status = 'scheduled' OR status = 'approved')
                      AND scheduled_publish_date IS NOT NULL 
                      AND (schedule_type = 'date_time' OR (schedule_type IS NULL AND TIME(scheduled_publish_date) != '00:00:00'))
                      AND scheduled_publish_date <= CURRENT_TIMESTAMP
                `);
            } catch (queryErr) {
                // Defensive fallback if 'schedule_type' column does not exist yet
                if ((queryErr.code === 'ER_BAD_FIELD_ERROR' || queryErr.errno === 1054) && String(queryErr.message).includes('schedule_type')) {
                    [dueItems] = await pool.query(`
                        SELECT id, title, slug, user_id, scheduled_publish_date 
                        FROM contents 
                        WHERE (status = 'scheduled' OR status = 'approved')
                          AND scheduled_publish_date IS NOT NULL 
                          AND TIME(scheduled_publish_date) != '00:00:00'
                          AND scheduled_publish_date <= CURRENT_TIMESTAMP
                    `);
                    pool.query("ALTER TABLE contents ADD COLUMN schedule_type VARCHAR(50) DEFAULT 'date_only' AFTER scheduled_publish_date").catch(() => {});
                } else {
                    throw queryErr;
                }
            }

            if (!dueItems || dueItems.length === 0) {
                return { count: 0, publishedIds: [] };
            }

            const ids = dueItems.map(i => i.id);
            await pool.query(`
                UPDATE contents 
                SET status = 'published', 
                    published_date = COALESCE(published_date, scheduled_publish_date, CURRENT_TIMESTAMP),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id IN (?)
            `, [ids]);

            console.log(`[Scheduled Publisher] Automatically published ${ids.length} scheduled item(s):`, ids);

            // Automated Subscriber Notification Trigger
            try {
                const ContentNotificationService = require('./contentNotificationService');
                for (const item of dueItems) {
                    ContentNotificationService.notifySubscribersOnPublication(item.id).catch(err => {
                        console.error(`[Scheduled Publisher] Notification error for content ${item.id}:`, err.message);
                    });
                }
            } catch (notifErr) {
                console.error('[Scheduled Publisher] ContentNotificationService error:', notifErr.message);
            }

            // Automatically update sitemap whenever scheduled content publishes
            try {
                const SitemapService = require('./sitemapService');
                SitemapService.notifyContentChanged();
            } catch (sitemapErr) {
                console.warn('[Scheduled Publisher] Sitemap update warning:', sitemapErr.message);
            }

            return { count: ids.length, publishedIds: ids };
        } catch (err) {
            console.error('[Scheduled Publisher] Error checking scheduled content:', err.message);
            return { count: 0, publishedIds: [], error: err.message };
        }
    }
}

module.exports = ScheduledPublishingService;

