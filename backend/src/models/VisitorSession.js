const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class VisitorSession {
    static async create(sessionData) {
        const {
            consent_uuid,
            user_id,
            subscriber_id,
            country,
            browser,
            operating_system,
            device_type,
            screen_resolution,
            language,
            timezone,
            ip_address,
            referrer,
            landing_page
        } = sessionData;

        // Auto-resolve subscriber_id from sid, subscriber_id, email, or token in landing_page
        let finalSubscriberId = subscriber_id ? parseInt(subscriber_id, 10) : null;
        if (!finalSubscriberId && landing_page) {
            const sidMatch = landing_page.match(/[?&](?:sid|subscriber_id)=([0-9]+)/i);
            if (sidMatch) {
                finalSubscriberId = parseInt(sidMatch[1], 10);
            } else {
                const emailMatch = landing_page.match(/[?&]email=([^&#]+)/i);
                if (emailMatch) {
                    try {
                        const decodedEmail = decodeURIComponent(emailMatch[1]);
                        const [subRows] = await pool.query('SELECT id FROM newsletter_subscribers WHERE email = ? LIMIT 1', [decodedEmail]);
                        if (subRows && subRows[0]) finalSubscriberId = subRows[0].id;
                    } catch (e) {
                        // Ignore query error
                    }
                }
                if (!finalSubscriberId) {
                    const tokenMatch = landing_page.match(/[?&]token=([a-f0-9]{32,64})/i);
                    if (tokenMatch) {
                        try {
                            const [subRows] = await pool.query('SELECT id FROM newsletter_subscribers WHERE unsubscribe_token = ? LIMIT 1', [tokenMatch[1]]);
                            if (subRows && subRows[0]) finalSubscriberId = subRows[0].id;
                        } catch (e) {
                            // Ignore query error
                        }
                    }
                }
            }
        }

        const session_uuid = uuidv4();

        const query = `
            INSERT INTO visitor_sessions (
                session_uuid, consent_uuid, user_id, subscriber_id, country, browser, operating_system,
                device_type, screen_resolution, language, timezone, ip_address, referrer, landing_page
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            session_uuid, consent_uuid || null, user_id, finalSubscriberId, country, browser, operating_system,
            device_type, screen_resolution, language, timezone, ip_address, referrer, landing_page
        ];

        await pool.query(query, values);

        // Record in email_campaign_clicks table for audit and engagement history
        if (finalSubscriberId || (landing_page && /utm_source=email|utm_medium=email|utm_medium=newsletter/i.test(landing_page))) {
            try {
                let subEmail = null;
                if (finalSubscriberId) {
                    const [sub] = await pool.query('SELECT email FROM newsletter_subscribers WHERE id = ?', [finalSubscriberId]);
                    subEmail = sub[0]?.email || null;
                }
                const campMatch = landing_page ? landing_page.match(/[?&]utm_campaign=([^&#]+)/i) : null;
                const campName = campMatch ? decodeURIComponent(campMatch[1]) : (landing_page.includes('subscriber-preferences') ? 'preferences' : (landing_page.includes('unsubscribe') ? 'unsubscribe' : 'general_email'));
                await pool.query(
                    'INSERT INTO email_campaign_clicks (subscriber_id, session_uuid, recipient_email, campaign_name, target_url, ip_address, user_agent, device_type, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [finalSubscriberId, session_uuid, subEmail, campName, landing_page, ip_address, browser, device_type, country]
                );
            } catch (err) {
                console.warn('[VisitorSession] Click record notice:', err.message);
            }
        }

        return await VisitorSession.findByUuid(session_uuid);
    }

    static async findByUuid(session_uuid) {
        const query = 'SELECT * FROM visitor_sessions WHERE session_uuid = ?';
        const [rows] = await pool.query(query, [session_uuid]);
        return rows[0];
    }

    static async findByConsentUuid(consent_uuid) {
        const query = 'SELECT * FROM visitor_sessions WHERE consent_uuid = ? ORDER BY session_start DESC LIMIT 1';
        const [rows] = await pool.query(query, [consent_uuid]);
        return rows[0];
    }

    static async update(session_uuid, updateData) {
        const allowedFields = [
            'session_end', 'total_session_duration', 'total_pages_visited',
            'exit_page'
        ];

        const updates = [];
        const values = [];

        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(updateData[field]);
            }
        }

        if (updates.length === 0) return null;

        values.push(session_uuid);
        const query = `UPDATE visitor_sessions SET ${updates.join(', ')} WHERE session_uuid = ?`;

        await pool.query(query, values);
        return await VisitorSession.findByUuid(session_uuid);
    }

    static async getAnalytics(filters = {}) {
        let baseWhere = ' WHERE 1=1';
        const values = [];

        if (filters.start_date) {
            baseWhere += ' AND session_start >= ?';
            values.push(filters.start_date);
        } else {
            // Default to last 90 days if no start date specified
            baseWhere += ' AND session_start >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
        }
        
        if (filters.end_date) {
            baseWhere += ' AND session_start <= ?';
            values.push(filters.end_date.includes(':') ? filters.end_date : `${filters.end_date} 23:59:59`);
        }

        const query = `
            SELECT 
                COUNT(*) as total_sessions,
                AVG(total_session_duration) as avg_session_duration,
                AVG(total_pages_visited) as avg_pages_per_session,
                COUNT(DISTINCT ip_address) as unique_visitors,
                SUM(CASE WHEN total_pages_visited = 1 THEN 1 ELSE 0 END) as bounce_count,
                device_type,
                country
            FROM visitor_sessions
            ${baseWhere}
            GROUP BY device_type, country
            ORDER BY total_sessions DESC
        `;

        const [rows] = await pool.query(query, values);
        if ((!rows || rows.length === 0) && (filters.start_date || filters.end_date)) {
            const fallbackQuery = `
                SELECT 
                    COUNT(*) as total_sessions,
                    AVG(total_session_duration) as avg_session_duration,
                    AVG(total_pages_visited) as avg_pages_per_session,
                    COUNT(DISTINCT ip_address) as unique_visitors,
                    SUM(CASE WHEN total_pages_visited = 1 THEN 1 ELSE 0 END) as bounce_count,
                    device_type,
                    country
                FROM visitor_sessions
                GROUP BY device_type, country
                ORDER BY total_sessions DESC
            `;
            const [fallbackRows] = await pool.query(fallbackQuery);
            return fallbackRows;
        }
        return rows;
    }
}

module.exports = VisitorSession;
