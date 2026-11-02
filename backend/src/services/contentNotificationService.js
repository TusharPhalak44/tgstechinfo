const { pool } = require('../config/database');
const { getNowInIST } = require('../utils/dateHelper');
const { getFrontendUrl } = require('../utils/urlHelper');
const { renderContentNotificationEmail } = require('./welcomeEmailTemplates');

class ContentNotificationService {
    /**
     * Dispatch Automated Content Notifications upon Publication
     * @param {number|string} contentId - ID of the newly published content
     */
    static async notifySubscribersOnPublication(contentId) {
        console.log(`[ContentNotification] Triggered for content #${contentId}`);
        try {
            // 1. Fetch content details with category and content_type
            const [contents] = await pool.query(
                `SELECT c.id, c.title, c.slug, c.short_description, c.status, c.is_visible_on_site, 
                        c.banner_image, c.tags, c.category_id, c.content_type_id, c.published_date,
                        ct.name as content_type_name, ct.slug as content_type_slug,
                        cat.name as category_name, cat.slug as category_slug, cat.type as category_type
                 FROM contents c
                 LEFT JOIN content_types ct ON c.content_type_id = ct.id
                 LEFT JOIN categories cat ON c.category_id = cat.id
                 WHERE c.id = ? LIMIT 1`,
                [contentId]
            );

            if (contents.length === 0) {
                console.warn(`[ContentNotification] Content #${contentId} not found, skipping notifications`);
                return { success: false, reason: 'content_not_found' };
            }

            const content = contents[0];

            // 2. Strict Publication Validation
            const isStatusPublished = content.status === 'published';
            const isVisible = content.is_visible_on_site === 1 || content.is_visible_on_site === true;
            const hasSlug = Boolean(content.slug && content.slug.trim());

            if (!isStatusPublished || !isVisible || !hasSlug) {
                console.log(`[ContentNotification] Content #${contentId} does not meet publication criteria (status: ${content.status}, visible: ${content.is_visible_on_site}). Skipping.`);
                return { success: false, reason: 'not_eligible_for_notification' };
            }

            // 3. Check Admin Master Switch for this content type in newsletter_notification_settings
            const rawTypeSlug = (content.content_type_slug || 'article').toLowerCase().replace(/-/g, '_');
            const settingKey = `notify_${rawTypeSlug}`;

            const [typeSettings] = await pool.query(
                'SELECT setting_value FROM newsletter_notification_settings WHERE setting_key = ?',
                [settingKey]
            );

            if (typeSettings.length > 0 && String(typeSettings[0].setting_value) === '0') {
                console.log(`[ContentNotification] Notifications disabled in master settings for type "${settingKey}". Skipping.`);
                return { success: false, reason: 'content_type_notifications_disabled' };
            }

            // Check master toggles for topics and general alerts
            const [topSetting] = await pool.query(
                "SELECT setting_value FROM newsletter_notification_settings WHERE setting_key = 'notify_topics_enabled'"
            ).catch(() => [[]]);
            const [genSetting] = await pool.query(
                "SELECT setting_value FROM newsletter_notification_settings WHERE setting_key = 'notify_general_enabled'"
            ).catch(() => [[]]);

            const notifyTopicsEnabled = topSetting.length === 0 || String(topSetting[0].setting_value) !== '0';
            const notifyGeneralEnabled = genSetting.length === 0 || String(genSetting[0].setting_value) !== '0';

            // 4. Extract Taxonomy Matching Keys (Category, Technology, Industry, and Tags)
            const matchedCategorySlug = (content.category_slug || '').toLowerCase().trim();
            const matchedCategoryType = (content.category_type || '').toLowerCase().trim(); // 'technology' | 'industry'

            // Determine if this content belongs to a specific Category / Technology / Industry
            const hasSpecificTopic = Boolean(matchedCategorySlug && matchedCategorySlug !== 'general' && matchedCategorySlug !== 'all');

            // Topic-based content should ONLY notify subscribers who explicitly subscribed to that topic/technology.
            // General subscribers are NOT spammed on every specific category publish (they receive the Weekly Digest).
            // General subscribers only receive instant alerts if the content is general/editorial or if no specific topic exists.
            const allowGeneralSubscribers = !hasSpecificTopic && notifyGeneralEnabled;

            // Parse tags into lowercase strings
            let parsedTags = [];
            if (content.tags) {
                if (Array.isArray(content.tags)) {
                    parsedTags = content.tags.map(t => String(t).toLowerCase().trim());
                } else {
                    try {
                        const jsonTags = JSON.parse(content.tags);
                        if (Array.isArray(jsonTags)) parsedTags = jsonTags.map(t => String(t).toLowerCase().trim());
                    } catch (_) {
                        parsedTags = String(content.tags).split(',').map(t => t.toLowerCase().trim()).filter(Boolean);
                    }
                }
            }

            // 5. Query All Matching Eligible Subscribers with Topic-First Priority
            // - When content has a specific topic (e.g. Data Science), ONLY topic subscribers get instant notification.
            // - Space vs Hyphen normalization ensures "data-science" matches "data science" 100% reliably.
            const matchingQuery = `
                SELECT 
                    s.id as subscriber_id,
                    s.email,
                    s.name,
                    s.unsubscribe_token,
                    i.interest_type,
                    i.interest_value,
                    CASE 
                        WHEN i.interest_type IN ('technology', 'industry') THEN 1
                        ELSE 0
                    END as is_topic_match
                FROM newsletter_subscribers s
                JOIN newsletter_subscription_interests i ON s.id = i.subscriber_id AND i.is_active = 1
                WHERE s.is_active = 1 
                  AND s.preferences_instant_alerts = 1
                  AND (
                      -- Condition 1: Topic Subscribers (Technology / Industry)
                      (? = 1 AND (
                          (i.interest_type = 'technology' AND s.preferences_technology_alerts = 1 AND (
                              LOWER(i.interest_value) = ? 
                              OR REPLACE(LOWER(i.interest_value), '-', ' ') = REPLACE(?, '-', ' ')
                              OR REPLACE(LOWER(i.interest_value), ' ', '-') = REPLACE(?, ' ', '-')
                              OR LOWER(i.interest_value) IN (?)
                          ))
                          OR
                          (i.interest_type = 'industry' AND s.preferences_industry_alerts = 1 AND (
                              LOWER(i.interest_value) = ? 
                              OR REPLACE(LOWER(i.interest_value), '-', ' ') = REPLACE(?, '-', ' ')
                              OR REPLACE(LOWER(i.interest_value), ' ', '-') = REPLACE(?, ' ', '-')
                              OR LOWER(i.interest_value) IN (?)
                          ))
                      ))
                      -- Condition 2: General Subscribers (only when content is general/non-topic or general alerts allowed)
                      OR (? = 1 AND (i.interest_type = 'general' AND s.preferences_general_alerts = 1))
                  )
                ORDER BY is_topic_match DESC, s.id DESC
            `;

            const techTagList = parsedTags.length > 0 ? parsedTags : ['__none__'];
            const indTagList = parsedTags.length > 0 ? parsedTags : ['__none__'];

            const [candidates] = await pool.query(matchingQuery, [
                notifyTopicsEnabled ? 1 : 0,
                matchedCategoryType === 'technology' ? matchedCategorySlug : '__none__',
                matchedCategoryType === 'technology' ? matchedCategorySlug : '__none__',
                matchedCategoryType === 'technology' ? matchedCategorySlug : '__none__',
                techTagList,
                matchedCategoryType === 'industry' ? matchedCategorySlug : '__none__',
                matchedCategoryType === 'industry' ? matchedCategorySlug : '__none__',
                matchedCategoryType === 'industry' ? matchedCategorySlug : '__none__',
                indTagList,
                allowGeneralSubscribers ? 1 : 0
            ]);

            // Deduplicate by subscriber_id while preserving Topic match over General match
            const uniqueSubscribersMap = new Map();
            for (const row of candidates) {
                if (!uniqueSubscribersMap.has(row.subscriber_id)) {
                    uniqueSubscribersMap.set(row.subscriber_id, {
                        subscriber_id: row.subscriber_id,
                        email: row.email,
                        name: row.name,
                        unsubscribe_token: row.unsubscribe_token,
                        matched_interest_type: row.is_topic_match ? row.interest_type : 'general',
                        matched_interest_value: row.is_topic_match ? row.interest_value : 'all',
                        is_topic_match: row.is_topic_match
                    });
                } else if (row.is_topic_match) {
                    // Upgrade existing general match to topic match if subscriber has both
                    const existingSub = uniqueSubscribersMap.get(row.subscriber_id);
                    existingSub.matched_interest_type = row.interest_type;
                    existingSub.matched_interest_value = row.interest_value;
                    existingSub.is_topic_match = 1;
                }
            }

            // Sort: Priority 1 to Topic Subscribers, Priority 2 to General Subscribers
            const eligibleSubscribers = Array.from(uniqueSubscribersMap.values())
                .sort((a, b) => (b.is_topic_match - a.is_topic_match) || (b.subscriber_id - a.subscriber_id));

            console.log(`[ContentNotification] Found ${eligibleSubscribers.length} eligible unique subscribers (${eligibleSubscribers.filter(s => s.is_topic_match).length} topic-matched) for content #${contentId}`);

            if (eligibleSubscribers.length === 0) {
                return { success: true, count: 0, message: 'No eligible subscribers found for this publication.' };
            }

            // 6. Enqueue Email Notifications with Strict Database Uniqueness
            const frontendUrl = getFrontendUrl();
            const currentIstTime = getNowInIST();

            let queuedCount = 0;
            let duplicateSkippedCount = 0;

            for (const sub of eligibleSubscribers) {
                // Rule 4 & 5: Check if notification was already generated/sent to this subscriber for this content
                const [existingLog] = await pool.query(
                    `SELECT id FROM newsletter_notification_logs 
                     WHERE subscriber_id = ? AND content_id = ? AND notification_type = 'instant_publish' 
                     LIMIT 1`,
                    [sub.subscriber_id, content.id]
                );

                if (existingLog.length > 0) {
                    duplicateSkippedCount++;
                    continue; // Skip duplicate send
                }

                const unsubscribeUrl = `${frontendUrl}/unsubscribe?token=${sub.unsubscribe_token}&email=${encodeURIComponent(sub.email)}`;
                const preferencesUrl = `${frontendUrl}/subscriber-preferences?token=${sub.unsubscribe_token}&email=${encodeURIComponent(sub.email)}`;

                const matchedReasonText = sub.matched_interest_type === 'general'
                    ? 'your general Weekly Tech Intelligence subscription'
                    : `your subscribed interest in ${sub.matched_interest_value.replace(/-/g, ' ').toUpperCase()}`;

                const emailHtml = renderContentNotificationEmail({
                    subscriberName: sub.name,
                    content,
                    matchedReason: matchedReasonText,
                    frontendUrl,
                    unsubscribeUrl,
                    preferencesUrl
                });

                const emailSubject = `New ${content.content_type_name || 'Tech'} Insights: ${content.title}`;

                // Insert into newsletter_notification_logs with status 'queued'
                try {
                    await pool.query(
                        `INSERT INTO newsletter_notification_logs 
                         (subscriber_id, content_id, notification_type, matched_interest_type, matched_interest_value, email_status, created_at)
                         VALUES (?, ?, 'instant_publish', ?, ?, 'queued', ?)`,
                        [
                            sub.subscriber_id,
                            content.id,
                            sub.matched_interest_type,
                            sub.matched_interest_value,
                            currentIstTime
                        ]
                    );

                    // Insert job into newsletter_email_queue
                    await pool.query(
                        `INSERT INTO newsletter_email_queue 
                         (subscriber_id, recipient_email, recipient_name, subject, html_content, content_id, job_type, status, created_at)
                         VALUES (?, ?, ?, ?, ?, ?, 'instant_content_alert', 'pending', ?)`,
                        [
                            sub.subscriber_id,
                            sub.email,
                            sub.name,
                            emailSubject,
                            emailHtml,
                            content.id,
                            currentIstTime
                        ]
                    );

                    queuedCount++;
                } catch (insertErr) {
                    // Unique constraint violation safely caught
                    if (insertErr.code === 'ER_DUP_ENTRY' || insertErr.errno === 1062) {
                        duplicateSkippedCount++;
                    } else {
                        console.error(`[ContentNotification] Error enqueueing for subscriber ${sub.email}:`, insertErr.message);
                    }
                }
            }

            console.log(`[ContentNotification] Successfully queued ${queuedCount} notification jobs (${duplicateSkippedCount} duplicates prevented).`);

            // 7. Trigger the background queue processor immediately
            const { processEmailQueue } = require('./emailQueueWorker');
            setImmediate(() => {
                processEmailQueue().catch(err => console.warn('[ContentNotification] Background worker note:', err.message));
            });

            return {
                success: true,
                totalEligible: eligibleSubscribers.length,
                queued: queuedCount,
                duplicateSkipped: duplicateSkippedCount
            };
        } catch (error) {
            console.error('[ContentNotification] Exception in notifySubscribersOnPublication:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = ContentNotificationService;

