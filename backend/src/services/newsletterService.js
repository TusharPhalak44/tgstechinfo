const crypto = require('crypto');
const { pool } = require('../config/database');
const { getNowInIST } = require('../utils/dateHelper');
const { getFrontendUrl } = require('../utils/urlHelper');
const { extractNameFromEmail } = require('../config/email');
const {
    renderGeneralWelcomeEmail,
    renderTopicWelcomeEmail,
    renderContentSpecificWelcomeEmail
} = require('./welcomeEmailTemplates');

class NewsletterService {
    /**
     * Centralized Subscriber Handler for All Website Touchpoints
     */
    static async subscribe({
        email,
        name = null,
        source = 'homepage',
        source_page_url = null,
        source_page_title = null,
        interest_type = 'general',
        interest_value = 'all',
        content_id = null,
        content_type = null,
        ip_address = null,
        user_agent = null
    }) {
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            throw new Error('A valid email address is required.');
        }

        const normalizedEmail = email.trim().toLowerCase();
        const extractedName = extractNameFromEmail(normalizedEmail);
        const greetingName = (typeof name === 'string' && name.trim()) 
            ? name.trim() 
            : (extractedName || 'there');

        const frontendUrl = getFrontendUrl();

        // 1. Find or create subscriber in newsletter_subscribers
        const [existing] = await pool.query(
            'SELECT * FROM newsletter_subscribers WHERE email = ?',
            [normalizedEmail]
        );

        let subscriber = null;
        let isNewSubscriber = false;
        let wasReactivated = false;
        const currentIstTime = getNowInIST();

        if (existing.length > 0) {
            subscriber = existing[0];
            const token = subscriber.unsubscribe_token || crypto.randomBytes(32).toString('hex');

            if (!subscriber.is_active) {
                // Reactivate previously unsubscribed user
                await pool.query(
                    `UPDATE newsletter_subscribers 
                     SET is_active = 1, unsubscribed_at = NULL, unsubscribe_reason = NULL, 
                         name = COALESCE(?, name), unsubscribe_token = ?, last_active_source = ? 
                     WHERE id = ?`,
                    [greetingName !== 'there' ? greetingName : null, token, source, subscriber.id]
                );
                wasReactivated = true;
            } else if (greetingName && greetingName !== 'there' && !subscriber.name) {
                await pool.query(
                    'UPDATE newsletter_subscribers SET name = ?, last_active_source = ? WHERE id = ?',
                    [greetingName, source, subscriber.id]
                );
            }
            subscriber.unsubscribe_token = token;
        } else {
            // Completely new subscriber
            const unsubscribeToken = crypto.randomBytes(32).toString('hex');
            const [insertResult] = await pool.query(
                `INSERT INTO newsletter_subscribers 
                 (email, name, unsubscribe_token, is_active, last_active_source, created_at) 
                 VALUES (?, ?, ?, 1, ?, ?)`,
                [
                    normalizedEmail,
                    greetingName !== 'there' ? greetingName : null,
                    unsubscribeToken,
                    source,
                    currentIstTime
                ]
            );
            subscriber = {
                id: insertResult.insertId,
                email: normalizedEmail,
                name: greetingName,
                unsubscribe_token: unsubscribeToken,
                is_active: 1
            };
            isNewSubscriber = true;
        }

        // 2. Register Topic / Category / General Interest in newsletter_subscription_interests
        const normalizedInterestType = ['general', 'technology', 'industry'].includes(interest_type)
            ? interest_type
            : 'general';
        const normalizedInterestValue = (interest_value && String(interest_value).trim())
            ? String(interest_value).trim().toLowerCase()
            : (normalizedInterestType === 'general' ? 'all' : 'general');

        await pool.query(
            `INSERT INTO newsletter_subscription_interests 
             (subscriber_id, interest_type, interest_value, is_active) 
             VALUES (?, ?, ?, 1)
             ON DUPLICATE KEY UPDATE is_active = 1, updated_at = CURRENT_TIMESTAMP`,
            [subscriber.id, normalizedInterestType, normalizedInterestValue]
        );

        // If user subscribed with a general source (homepage, footer, or listing page), also ensure 'general' / 'all' interest is recorded
        if (['homepage', 'footer', 'articles', 'news', 'interviews', 'ebooks', 'blogs', 'whitepapers', 'webinars', 'events', 'case_studies'].includes(source)) {
            await pool.query(
                `INSERT INTO newsletter_subscription_interests 
                 (subscriber_id, interest_type, interest_value, is_active) 
                 VALUES (?, 'general', 'all', 1)
                 ON DUPLICATE KEY UPDATE is_active = 1`,
                [subscriber.id]
            );
        }

        // 3. Record Activity History in newsletter_subscription_activities (Preserves multi-page touchpoint history)
        await pool.query(
            `INSERT INTO newsletter_subscription_activities 
             (subscriber_id, subscription_source, source_page_url, source_page_title, interest_type, interest_value, content_id, content_type, ip_address, user_agent, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                subscriber.id,
                source,
                source_page_url ? String(source_page_url).slice(0, 1000) : null,
                source_page_title ? String(source_page_title).slice(0, 500) : null,
                normalizedInterestType,
                normalizedInterestValue,
                content_id ? parseInt(content_id, 10) : null,
                content_type ? String(content_type).slice(0, 50) : null,
                ip_address || null,
                user_agent || null,
                currentIstTime
            ]
        );

        // 4. Generate & Enqueue Appropriate Dynamic Welcome Email
        const unsubscribeUrl = `${frontendUrl}/unsubscribe?token=${subscriber.unsubscribe_token}&email=${encodeURIComponent(normalizedEmail)}`;
        const preferencesUrl = `${frontendUrl}/subscriber-preferences?token=${subscriber.unsubscribe_token}&email=${encodeURIComponent(normalizedEmail)}`;

        let welcomeEmailHtml = '';
        let welcomeSubject = '';
        let jobType = 'welcome_general';

        if (source === 'content_detail' && source_page_title) {
            // Template 3: Content-Specific Welcome Email
            welcomeSubject = `Thanks for Subscribing! More ${source_page_title.slice(0, 40)} Insights Coming Your Way`;
            welcomeEmailHtml = renderContentSpecificWelcomeEmail({
                name: greetingName,
                contentTitle: source_page_title,
                contentType: content_type || 'Article',
                categoryName: normalizedInterestValue !== 'all' ? normalizedInterestValue.replace(/-/g, ' ').toUpperCase() : 'Enterprise Tech',
                frontendUrl,
                unsubscribeUrl,
                preferencesUrl
            });
            jobType = 'welcome_content';
        } else if (normalizedInterestType === 'technology' || normalizedInterestType === 'industry') {
            // Template 2: Technology / Industry Welcome Email
            const formattedTopic = normalizedInterestValue.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            welcomeSubject = `Your Weekly ${formattedTopic} Insights Start Here`;
            welcomeEmailHtml = renderTopicWelcomeEmail({
                name: greetingName,
                topicType: normalizedInterestType,
                topicName: formattedTopic,
                frontendUrl,
                unsubscribeUrl,
                preferencesUrl
            });
            jobType = 'welcome_topic';
        } else {
            // Template 1: General Welcome Email
            welcomeSubject = `Welcome to TGS Tech Info | Your Weekly Tech Intelligence Starts Here`;
            welcomeEmailHtml = renderGeneralWelcomeEmail({
                name: greetingName,
                frontendUrl,
                unsubscribeUrl,
                preferencesUrl
            });
            jobType = 'welcome_general';
        }

        // Enqueue welcome email into newsletter_email_queue
        await pool.query(
            `INSERT INTO newsletter_email_queue 
             (subscriber_id, recipient_email, recipient_name, subject, html_content, job_type, status, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
            [
                subscriber.id,
                normalizedEmail,
                greetingName,
                welcomeSubject,
                welcomeEmailHtml,
                jobType,
                currentIstTime
            ]
        );

        // Trigger immediate background dispatch
        const { processEmailQueue } = require('./emailQueueWorker');
        setImmediate(() => {
            processEmailQueue().catch(err => console.warn('[NewsletterService] Queue trigger note:', err.message));
        });

        return {
            success: true,
            isNewSubscriber,
            wasReactivated,
            alreadySubscribed: !isNewSubscriber && !wasReactivated,
            message: wasReactivated
                ? 'Welcome back! Your newsletter subscription has been reactivated.'
                : (isNewSubscriber
                    ? 'Successfully subscribed to the newsletter! We have sent a welcome briefing to your email.'
                    : 'You are subscribed to our newsletter! We have re-sent your confirmation email.')
        };
    }

    /**
     * Retrieve Preferences & Active Interests by Token or Email
     */
    static async getPreferences(tokenOrEmail) {
        if (!tokenOrEmail) return null;
        const normalized = String(tokenOrEmail).trim().toLowerCase();

        const [subs] = await pool.query(
            'SELECT * FROM newsletter_subscribers WHERE unsubscribe_token = ? OR LOWER(email) = ? LIMIT 1',
            [normalized, normalized]
        );

        if (subs.length === 0) return null;
        const sub = subs[0];

        // Fetch registered interests
        const [interests] = await pool.query(
            `SELECT interest_type, interest_value, is_active, created_at 
             FROM newsletter_subscription_interests 
             WHERE subscriber_id = ?`,
            [sub.id]
        );

        // Fetch available taxonomy from categories table for easy selection in preferences UI
        const [categories] = await pool.query(
            `SELECT id, name, slug, type FROM categories ORDER BY name ASC`
        );

        const technologies = categories.filter(c => c.type === 'technology');
        const industries = categories.filter(c => c.type === 'industry');

        return {
            subscriber: {
                id: sub.id,
                email: sub.email,
                name: sub.name,
                is_active: sub.is_active,
                preferences_instant_alerts: Boolean(sub.preferences_instant_alerts),
                preferences_weekly_digest: Boolean(sub.preferences_weekly_digest),
                preferences_general_alerts: Boolean(sub.preferences_general_alerts),
                preferences_technology_alerts: Boolean(sub.preferences_technology_alerts),
                preferences_industry_alerts: Boolean(sub.preferences_industry_alerts),
                created_at: sub.created_at
            },
            interests,
            availableTopics: {
                technologies,
                industries
            }
        };
    }

    /**
     * Update Subscriber Preferences and Topics
     */
    static async updatePreferences(tokenOrEmail, preferencesData = {}, selectedTopics = []) {
        if (!tokenOrEmail) throw new Error('Verification token or email is required.');
        const normalized = String(tokenOrEmail).trim().toLowerCase();

        const [subs] = await pool.query(
            'SELECT id FROM newsletter_subscribers WHERE unsubscribe_token = ? OR LOWER(email) = ? LIMIT 1',
            [normalized, normalized]
        );

        if (subs.length === 0) throw new Error('Subscriber not found.');
        const subscriberId = subs[0].id;

        // 1. Update preference flags
        const updateFields = [];
        const updateVals = [];

        if (preferencesData.preferences_instant_alerts !== undefined) {
            updateFields.push('preferences_instant_alerts = ?');
            updateVals.push(preferencesData.preferences_instant_alerts ? 1 : 0);
        }
        if (preferencesData.preferences_weekly_digest !== undefined) {
            updateFields.push('preferences_weekly_digest = ?');
            updateVals.push(preferencesData.preferences_weekly_digest ? 1 : 0);
        }
        if (preferencesData.preferences_general_alerts !== undefined) {
            updateFields.push('preferences_general_alerts = ?');
            updateVals.push(preferencesData.preferences_general_alerts ? 1 : 0);
        }
        if (preferencesData.preferences_technology_alerts !== undefined) {
            updateFields.push('preferences_technology_alerts = ?');
            updateVals.push(preferencesData.preferences_technology_alerts ? 1 : 0);
        }
        if (preferencesData.preferences_industry_alerts !== undefined) {
            updateFields.push('preferences_industry_alerts = ?');
            updateVals.push(preferencesData.preferences_industry_alerts ? 1 : 0);
        }

        if (updateFields.length > 0) {
            updateVals.push(subscriberId);
            await pool.query(
                `UPDATE newsletter_subscribers SET ${updateFields.join(', ')} WHERE id = ?`,
                updateVals
            );
        }

        // 2. Update selected topics if passed
        if (Array.isArray(selectedTopics)) {
            // First deactivate existing topic-based interests (preserve general if not passed)
            await pool.query(
                `UPDATE newsletter_subscription_interests 
                 SET is_active = 0 
                 WHERE subscriber_id = ? AND interest_type IN ('technology', 'industry')`,
                [subscriberId]
            );

            // Re-activate or insert newly selected topics
            for (const topic of selectedTopics) {
                if (topic.type && topic.value) {
                    await pool.query(
                        `INSERT INTO newsletter_subscription_interests 
                         (subscriber_id, interest_type, interest_value, is_active) 
                         VALUES (?, ?, ?, 1)
                         ON DUPLICATE KEY UPDATE is_active = 1`,
                        [subscriberId, topic.type, topic.value.toLowerCase().trim()]
                    );
                }
            }
        }

        return { success: true, message: 'Preferences updated successfully.' };
    }
}

module.exports = NewsletterService;

