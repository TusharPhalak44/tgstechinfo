const { pool } = require('../config/database');
const { sendEventReminderEmail } = require('./eventEmailService');

/**
 * Run automated checks for 24h and 1h event reminders
 */
async function checkAndSendReminders() {
    try {
        // 1. Process 24-hour reminders (Events starting between 23h and 25h from now)
        const [rows24h] = await pool.query(`
            SELECT r.*, e.title, e.slug, e.event_type, e.event_mode, e.start_date, e.online_join_url, e.virtual_join_url, e.venue_name, e.venue_address
            FROM event_registrations r
            JOIN events e ON r.event_id = e.id
            WHERE e.status = 'published'
              AND r.status = 'confirmed'
              AND r.reminder_24h_sent = 0
              AND e.start_date BETWEEN DATE_ADD(NOW(), INTERVAL 23 HOUR) AND DATE_ADD(NOW(), INTERVAL 25 HOUR)
            LIMIT 50
        `);

        for (const record of rows24h) {
            try {
                await sendEventReminderEmail({
                    attendee: record,
                    event: record,
                    timingLabel: 'Tomorrow'
                });
                await pool.query('UPDATE event_registrations SET reminder_24h_sent = 1 WHERE id = ?', [record.id]);
                console.log(`[Event Reminder 24h] Sent to ${record.email} for event "${record.title}"`);
            } catch (err) {
                console.error(`[Event Reminder 24h] Error sending to ${record.email}:`, err.message);
            }
        }

        // 2. Process 1-hour reminders (Events starting between 45 mins and 75 mins from now)
        const [rows1h] = await pool.query(`
            SELECT r.*, e.title, e.slug, e.event_type, e.event_mode, e.start_date, e.online_join_url, e.virtual_join_url, e.venue_name, e.venue_address
            FROM event_registrations r
            JOIN events e ON r.event_id = e.id
            WHERE e.status = 'published'
              AND r.status = 'confirmed'
              AND r.reminder_1h_sent = 0
              AND e.start_date BETWEEN DATE_ADD(NOW(), INTERVAL 45 MINUTE) AND DATE_ADD(NOW(), INTERVAL 75 MINUTE)
            LIMIT 50
        `);

        for (const record of rows1h) {
            try {
                await sendEventReminderEmail({
                    attendee: record,
                    event: record,
                    timingLabel: 'Starting in 1 Hour'
                });
                await pool.query('UPDATE event_registrations SET reminder_1h_sent = 1 WHERE id = ?', [record.id]);
                console.log(`[Event Reminder 1h] Sent to ${record.email} for event "${record.title}"`);
            } catch (err) {
                console.error(`[Event Reminder 1h] Error sending to ${record.email}:`, err.message);
            }
        }
    } catch (err) {
        console.error('[EventReminderService] General runner error:', err.message);
    }
}

function startReminderCron(intervalMinutes = 15) {
    console.log(`[EventReminderService] Initialized with interval of ${intervalMinutes} minute(s).`);
    // Run initial check after 10 seconds
    setTimeout(checkAndSendReminders, 10 * 1000);
    const interval = setInterval(checkAndSendReminders, intervalMinutes * 60 * 1000);
    if (interval.unref) interval.unref();
    return interval;
}

module.exports = {
    checkAndSendReminders,
    startReminderCron
};
