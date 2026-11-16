const { pool } = require('../config/database');

/**
 * Automatically expire and unpublish past live webinars and events.
 * Concluded live sessions are archived and hidden so they never appear on the public website.
 */
async function expirePastLiveEventsAndWebinars() {
    try {
        // 1. Auto-archive past live webinars and events from contents table
        const [contentResult] = await pool.query(`
            UPDATE contents c
            JOIN content_types ct ON c.content_type_id = ct.id
            SET c.is_visible_on_site = 0,
                c.status = 'archived'
            WHERE (ct.slug IN ('webinar', 'event') OR c.content_type_id IN (5, 6))
              AND (c.webinar_type = 'live' OR c.webinar_type IS NULL)
              AND c.webinar_date IS NOT NULL
              AND c.webinar_date < CURRENT_TIMESTAMP
              AND c.status = 'published'
        `);

        if (contentResult && contentResult.affectedRows > 0) {
            console.log(`[ExpirationService] Auto-archived ${contentResult.affectedRows} concluded live webinar(s)/event(s) from contents table.`);
        }

        // 2. Auto-archive past events from events table
        const [eventResult] = await pool.query(`
            UPDATE events
            SET status = 'archived'
            WHERE COALESCE(end_date, start_date) < CURRENT_TIMESTAMP
              AND status = 'published'
        `);

        if (eventResult && eventResult.affectedRows > 0) {
            console.log(`[ExpirationService] Auto-archived ${eventResult.affectedRows} concluded event(s) from events table.`);
        }
    } catch (err) {
        console.error('[ExpirationService] Error running expiration cleanup:', err.message);
    }
}

/**
 * Start periodic cron runner for live event/webinar expiration
 * @param {number} intervalMinutes Frequency in minutes (default 10)
 */
function startExpirationCron(intervalMinutes = 10) {
    console.log(`[ExpirationService] Initialized with interval of ${intervalMinutes} minute(s).`);
    // Run initial check after 5 seconds
    setTimeout(expirePastLiveEventsAndWebinars, 5 * 1000);
    const interval = setInterval(expirePastLiveEventsAndWebinars, intervalMinutes * 60 * 1000);
    if (interval.unref) interval.unref();
    return interval;
}

module.exports = {
    expirePastLiveEventsAndWebinars,
    startExpirationCron
};

