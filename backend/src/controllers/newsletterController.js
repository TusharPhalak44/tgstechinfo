const Newsletter = require('../models/Newsletter');
const { pool } = require('../config/database');

exports.getSubscribers = async (req, res) => {
    try {
        const subscribers = await Newsletter.findAll();
        res.json(subscribers);
    } catch (error) {
        console.error('Get subscribers error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getSubscriberDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const [subs] = await pool.query('SELECT * FROM newsletter_subscribers WHERE id = ?', [id]);
        if (!subs || subs.length === 0) {
            return res.status(404).json({ message: 'Subscriber not found' });
        }
        const subscriber = subs[0];

        // Fetch interests
        const [interests] = await pool.query(
            'SELECT * FROM newsletter_subscription_interests WHERE subscriber_id = ? ORDER BY created_at DESC',
            [id]
        );

        // Fetch touchpoint activities
        const [activities] = await pool.query(
            'SELECT * FROM newsletter_subscription_activities WHERE subscriber_id = ? ORDER BY created_at DESC LIMIT 50',
            [id]
        );

        // Fetch sent notification logs
        const [notifications] = await pool.query(
            `SELECT nl.*, c.title as content_title 
             FROM newsletter_notification_logs nl
             LEFT JOIN contents c ON nl.content_id = c.id
             WHERE nl.subscriber_id = ? 
             ORDER BY nl.sent_at DESC LIMIT 50`,
            [id]
        );

        res.json({
            subscriber,
            interests,
            activities,
            notifications
        });
    } catch (error) {
        console.error('Get subscriber details error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.removeSubscriber = async (req, res) => {
    try {
        const { email } = req.params;
        const subscriber = await Newsletter.unsubscribe(email);
        
        if (!subscriber) {
            return res.status(404).json({ message: 'Subscriber not found' });
        }
        
        res.json({ message: 'Subscriber removed successfully' });
    } catch (error) {
        console.error('Remove subscriber error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.resubscribe = async (req, res) => {
    try {
        const { email } = req.params;
        const subscriber = await Newsletter.subscribe(email);
        res.json({ success: true, message: 'Subscriber activated successfully', subscriber });
    } catch (error) {
        console.error('Resubscribe error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getNotificationSettings = async (req, res) => {
    try {
        const [settings] = await pool.query(
            'SELECT * FROM newsletter_notification_settings ORDER BY id ASC'
        );
        // Map to format frontend expects
        const formatted = settings.map(s => {
            const match = s.setting_key.match(/^notify_(.+)$/);
            const contentType = match ? match[1] : s.setting_key;
            return {
                ...s,
                content_type: contentType,
                is_enabled: s.setting_value === '1' || s.setting_value === 1
            };
        });
        res.json(formatted);
    } catch (error) {
        console.error('Get notification settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateNotificationSettings = async (req, res) => {
    try {
        const { content_type, setting_key, is_enabled, setting_value } = req.body;
        const key = setting_key || (content_type ? `notify_${content_type}` : null);
        const val = setting_value !== undefined ? String(setting_value) : (is_enabled ? '1' : '0');

        if (!key) {
            return res.status(400).json({ message: 'setting_key or content_type is required' });
        }
        await pool.query(
            `INSERT INTO newsletter_notification_settings (setting_key, setting_value)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP`,
            [key, val]
        );
        res.json({ success: true, message: `Notification setting for ${key} updated.` });
    } catch (error) {
        console.error('Update notification settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getQueueStats = async (req, res) => {
    try {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
                SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
            FROM newsletter_email_queue
        `);
        res.json(stats[0] || { total: 0, pending: 0, processing: 0, sent: 0, failed: 0 });
    } catch (error) {
        console.error('Get queue stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};