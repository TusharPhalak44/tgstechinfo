const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');
const { getNowInIST } = require('../utils/dateHelper');
const { sendEmail } = require('../config/email');

let isProcessing = false;
const bannerAttachmentCache = new Map();

/**
 * Utility promise-based sleep
 * @param {number} ms 
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Loads and compresses banner image for CID inline embedding
 * Ensures images display 100% reliably in email clients on both localhost and live environments.
 */
async function getBannerAttachmentForContent(contentId) {
    if (!contentId) return null;
    if (bannerAttachmentCache.has(contentId)) {
        return bannerAttachmentCache.get(contentId);
    }

    try {
        const [contents] = await pool.query(
            'SELECT banner_image FROM contents WHERE id = ? LIMIT 1',
            [contentId]
        );

        if (!contents || contents.length === 0 || !contents[0].banner_image) {
            bannerAttachmentCache.set(contentId, null);
            return null;
        }

        const rawBanner = contents[0].banner_image;
        if (rawBanner.startsWith('http://') || rawBanner.startsWith('https://')) {
            bannerAttachmentCache.set(contentId, null);
            return null;
        }

        const bannerFilename = rawBanner.replace(/^\/?uploads\//, '').replace(/^\//, '');

        // 1. Check media_files in MySQL database first
        let buffer = null;
        let mimeType = 'image/jpeg';

        const [mediaRows] = await pool.query(
            'SELECT file_data, mime_type FROM media_files WHERE filename = ? LIMIT 1',
            [bannerFilename]
        );

        if (mediaRows && mediaRows[0] && mediaRows[0].file_data) {
            buffer = mediaRows[0].file_data;
            mimeType = mediaRows[0].mime_type || 'image/jpeg';
        } else {
            // 2. Check disk in uploads
            const diskPath = path.join(__dirname, '../../uploads', bannerFilename);
            if (fs.existsSync(diskPath)) {
                buffer = fs.readFileSync(diskPath);
            }
        }

        if (buffer && buffer.length > 0) {
            let finalBuffer = buffer;
            try {
                const sharp = require('sharp');
                finalBuffer = await sharp(buffer)
                    .resize({ width: 600, withoutEnlargement: true })
                    .jpeg({ quality: 80 })
                    .toBuffer();
                mimeType = 'image/jpeg';
            } catch (sharpErr) {
                // If sharp fails or is unavailable, use original buffer
            }

            const attachment = {
                filename: 'banner.jpg',
                content: finalBuffer,
                contentType: mimeType,
                cid: 'content_banner_img'
            };
            bannerAttachmentCache.set(contentId, attachment);
            return attachment;
        }
    } catch (e) {
        console.warn(`[EmailQueueWorker] Failed to prepare banner attachment for content #${contentId}:`, e.message);
    }

    bannerAttachmentCache.set(contentId, null);
    return null;
}

/**
 * Checks the number of emails dispatched in the last 60 minutes
 * to ensure Hostinger's 50/hr hard cap is never breached.
 */
async function checkHourlySendingLimit() {
    try {
        const maxPerHour = parseInt(process.env.MAX_EMAILS_PER_HOUR, 10) || 40;
        const [rows] = await pool.query(
            `SELECT COUNT(*) as sent_count 
             FROM newsletter_email_queue 
             WHERE status = 'completed' AND processed_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`
        );
        const sentInLastHour = parseInt(rows?.[0]?.sent_count, 10) || 0;
        return {
            allowed: sentInLastHour < maxPerHour,
            sentInLastHour,
            maxPerHour
        };
    } catch (err) {
        console.warn('[EmailQueueWorker] Hourly limit check warning:', err.message);
        return { allowed: true, sentInLastHour: 0, maxPerHour: 40 };
    }
}

/**
 * Process a batch of pending emails from newsletter_email_queue
 * with Hostinger anti-burst pacing (4.5s delay) and hourly safety cap.
 */
async function processEmailQueue() {
    if (isProcessing) {
        return { status: 'already_running' };
    }

    isProcessing = true;
    try {
        // 1. Guard against Hostinger Hourly Quota (Hostinger caps at 50/hour; our safe threshold is 40)
        const quota = await checkHourlySendingLimit();
        if (!quota.allowed) {
            console.warn(`[EmailQueueWorker] ⏳ Hostinger Hourly Quota Protection: ${quota.sentInLastHour}/${quota.maxPerHour} emails already sent in the past hour. Pausing delivery to prevent suspension.`);
            isProcessing = false;
            return { status: 'hourly_limit_reached', sentInLastHour: quota.sentInLastHour };
        }

        // 2. Fetch batch size setting (default safe batch of 5)
        const [settings] = await pool.query(
            "SELECT setting_value FROM newsletter_notification_settings WHERE setting_key = 'queue_batch_size'"
        ).catch(() => [[]]);
        const defaultBatchSize = parseInt(process.env.QUEUE_BATCH_SIZE, 10) || 5;
        const batchSize = Math.min(parseInt(settings?.[0]?.setting_value, 10) || defaultBatchSize, 8);

        // Calculate how many more emails can be sent this hour before reaching threshold
        const remainingCapacity = Math.max(1, quota.maxPerHour - quota.sentInLastHour);
        const effectiveLimit = Math.min(batchSize, remainingCapacity);

        // 3. Fetch pending jobs scheduled for now or in the past
        // Prioritize Welcome emails, then most recent fresh alerts
        const [jobs] = await pool.query(
            `SELECT id, subscriber_id, recipient_email, recipient_name, subject, html_content, 
                    content_id, job_type, attempt_count, max_attempts
             FROM newsletter_email_queue 
             WHERE status = 'pending' AND scheduled_for <= NOW() 
             ORDER BY 
                 CASE 
                     WHEN job_type LIKE 'welcome%' THEN 1
                     WHEN job_type = 'instant_content_alert' THEN 2
                     ELSE 3
                 END ASC,
                 id DESC 
             LIMIT ?`,
            [effectiveLimit]
        );

        if (jobs.length === 0) {
            isProcessing = false;
            return { status: 'empty', processed: 0 };
        }

        const pacingDelayMs = parseInt(process.env.QUEUE_EMAIL_DELAY_MS, 10) || 4500;
        console.log(`[EmailQueueWorker] Processing ${jobs.length} email jobs with anti-burst pacing (${pacingDelayMs / 1000}s gap between sends)...`);

        for (let i = 0; i < jobs.length; i++) {
            const job = jobs[i];

            // Lock job to processing
            await pool.query(
                "UPDATE newsletter_email_queue SET status = 'processing' WHERE id = ?",
                [job.id]
            );

            const currentIst = getNowInIST();

            try {
                let jobHtml = job.html_content;
                const attachments = [];

                if (job.content_id) {
                    const bannerAttachment = await getBannerAttachmentForContent(job.content_id);
                    if (bannerAttachment) {
                        attachments.push(bannerAttachment);
                        // Normalize any old /uploads/ URL in html_content to cid:content_banner_img
                        jobHtml = jobHtml.replace(
                            /<img([^>]+)src=["'](?:https?:\/\/[^"']+\/uploads\/[^"']+)["']/gi,
                            '<img$1src="cid:content_banner_img"'
                        );
                    }
                }

                // Send email using existing Nodemailer configuration
                const emailResult = await sendEmail(
                    job.recipient_email,
                    job.subject,
                    jobHtml,
                    { isBulk: true, attachments, job_type: job.job_type, utm_campaign: job.job_type || 'newsletter_alert' }
                );

                if (emailResult && emailResult.success) {
                    // Success: mark completed
                    await pool.query(
                        `UPDATE newsletter_email_queue 
                         SET status = 'completed', processed_at = ?, last_error = NULL 
                         WHERE id = ?`,
                        [currentIst, job.id]
                    );

                    // Update notification log if associated with published content
                    if (job.content_id) {
                        await pool.query(
                            `UPDATE newsletter_notification_logs 
                             SET email_status = 'sent', sent_at = ? 
                             WHERE subscriber_id = ? AND content_id = ? AND notification_type = 'instant_publish'`,
                            [currentIst, job.subscriber_id, job.content_id]
                        );
                    }

                    console.log(`[EmailQueueWorker] ✅ Job #${job.id} dispatched to ${job.recipient_email} (${i + 1}/${jobs.length})`);

                    // Rate-Limiter: Wait 4.5 seconds before sending the next email to prevent Hostinger burst flag
                    if (i < jobs.length - 1) {
                        console.log(`[EmailQueueWorker] ⏱️ Pacing pause: waiting ${pacingDelayMs / 1000}s before next email...`);
                        await sleep(pacingDelayMs);
                    }
                } else {
                    throw new Error(emailResult?.error || emailResult?.reason || 'Email delivery failed');
                }
            } catch (jobErr) {
                const isHostingerBlock = jobErr.message && (
                    jobErr.message.includes('451') ||
                    jobErr.message.includes('554') ||
                    jobErr.message.toLowerCase().includes('ratelimit') ||
                    jobErr.message.includes('disabled') ||
                    jobErr.message.includes('suspended')
                );

                console.warn(`[EmailQueueWorker] ⚠️ Job #${job.id} failed: ${jobErr.message}`);

                if (isHostingerBlock) {
                    // Do not count server rate-limit as subscriber delivery failure
                    // Postpone by 15 minutes to allow Hostinger rolling quota to cool down
                    await pool.query(
                        `UPDATE newsletter_email_queue 
                         SET status = 'pending', last_error = ?, 
                             scheduled_for = DATE_ADD(NOW(), INTERVAL 15 MINUTE) 
                         WHERE id = ?`,
                        [jobErr.message, job.id]
                    );

                    console.warn('[EmailQueueWorker] ⏳ Hostinger SMTP hourly rate-limit (451) is active. Backing off queue for 15 minutes to let Hostinger quota reset.');
                    break; // Halt this batch immediately to avoid hammering Hostinger
                }

                const newAttempt = job.attempt_count + 1;
                if (newAttempt < job.max_attempts) {
                    // Exponential backoff: retry in (newAttempt * 5) minutes
                    const backoffMinutes = newAttempt * 5;
                    await pool.query(
                        `UPDATE newsletter_email_queue 
                         SET status = 'pending', attempt_count = ?, last_error = ?, 
                             scheduled_for = DATE_ADD(NOW(), INTERVAL ? MINUTE) 
                         WHERE id = ?`,
                        [newAttempt, jobErr.message, backoffMinutes, job.id]
                    );
                } else {
                    // Exhausted all retry attempts
                    await pool.query(
                        `UPDATE newsletter_email_queue 
                         SET status = 'exhausted', attempt_count = ?, last_error = ? 
                         WHERE id = ?`,
                        [newAttempt, jobErr.message, job.id]
                    );

                    if (job.content_id) {
                        await pool.query(
                            `UPDATE newsletter_notification_logs 
                             SET email_status = 'failed' 
                             WHERE subscriber_id = ? AND content_id = ? AND notification_type = 'instant_publish'`,
                            [job.subscriber_id, job.content_id]
                        );
                    }
                }
            }
        }

        return { status: 'completed', processed: jobs.length };
    } catch (err) {
        console.error('[EmailQueueWorker] Batch processing exception:', err.message);
        return { status: 'error', error: err.message };
    } finally {
        isProcessing = false;
    }
}

/**
 * Start the background queue polling loop
 * @param {number} intervalMs - Poll interval in milliseconds (default: 30000 = 30 seconds)
 */
function startQueueWorker(intervalMs = 30000) {
    console.log(`[EmailQueueWorker] Background worker started (Polling every ${intervalMs / 1000}s with Anti-Burst Pacing)`);
    // Run an initial immediate tick
    processEmailQueue().catch(() => {});
    // Start recurring interval
    setInterval(() => {
        processEmailQueue().catch(err => {
            console.error('[EmailQueueWorker] Scheduled interval error:', err.message);
        });
    }, intervalMs);
}

module.exports = {
    processEmailQueue,
    startQueueWorker
};
