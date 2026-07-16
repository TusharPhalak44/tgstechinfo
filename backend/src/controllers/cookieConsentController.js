const CookieConsent = require('../models/CookieConsent');
const CookieConsentLog = require('../models/CookieConsentLog');
const { validationResult } = require('express-validator');

// Helper function to get client IP address
const getClientIp = (req) => {
    // Check various headers for real client IP (behind proxy/load balancer)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        // x-forwarded-for can contain multiple IPs, take the first one
        const ips = forwarded.split(',').map(ip => ip.trim());
        return normalizeIp(ips[0]);
    }
    
    // Check other common headers
    const realIp = req.headers['x-real-ip'];
    if (realIp) {
        return normalizeIp(realIp);
    }
    
    // Fallback to req.ip (works with trust proxy enabled)
    const ip = req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
    return normalizeIp(ip);
};

// Helper function to normalize IP address (convert IPv6 localhost to IPv4)
const normalizeIp = (ip) => {
    if (!ip) return '127.0.0.1';
    
    // Convert IPv6 localhost to IPv4
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
        return '127.0.0.1';
    }
    
    // Remove IPv6 prefix if present
    if (ip.startsWith('::ffff:')) {
        return ip.substring(7);
    }
    
    return ip;
};

exports.createConsent = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            consent_type,
            necessary_cookies = true,
            functional_cookies = false,
            analytics_cookies = false,
            marketing_cookies = false,
            session_id = null
        } = req.body;

        // Get user_id if authenticated
        const user_id = req.user?.id || null;

        // Validate consent_type
        const validTypes = ['accept_all', 'reject_all', 'custom'];
        if (!validTypes.includes(consent_type)) {
            return res.status(400).json({ message: 'Invalid consent_type. Must be accept_all, reject_all, or custom' });
        }

        // Apply preset values based on consent_type
        let cookieSettings = {
            necessary_cookies,
            functional_cookies,
            analytics_cookies,
            marketing_cookies
        };

        if (consent_type === 'accept_all') {
            cookieSettings = {
                necessary_cookies: true,
                functional_cookies: true,
                analytics_cookies: true,
                marketing_cookies: true
            };
        } else if (consent_type === 'reject_all') {
            cookieSettings = {
                necessary_cookies: true,
                functional_cookies: false,
                analytics_cookies: false,
                marketing_cookies: false
            };
        }

        // Check for existing consent
        let existingConsent = null;
        if (user_id) {
            existingConsent = await CookieConsent.findByUserId(user_id);
        } else if (session_id) {
            existingConsent = await CookieConsent.findBySessionId(session_id);
        }

        let consent;
        const consentData = {
            user_id,
            session_id,
            consent_type,
            ...cookieSettings,
            consent_version: existingConsent ? existingConsent.consent_version + 1 : 1,
            ip_address: getClientIp(req),
            user_agent: req.headers['user-agent']
        };

        if (existingConsent) {
            // Update existing consent
            consent = await CookieConsent.update(existingConsent.uuid, consentData);
            
            // Log the update
            await CookieConsentLog.create({
                consent_uuid: consent.uuid,
                action: 'update',
                previous_consent: {
                    consent_type: existingConsent.consent_type,
                    necessary_cookies: existingConsent.necessary_cookies,
                    functional_cookies: existingConsent.functional_cookies,
                    analytics_cookies: existingConsent.analytics_cookies,
                    marketing_cookies: existingConsent.marketing_cookies
                },
                new_consent: {
                    consent_type: consent.consent_type,
                    necessary_cookies: consent.necessary_cookies,
                    functional_cookies: consent.functional_cookies,
                    analytics_cookies: consent.analytics_cookies,
                    marketing_cookies: consent.marketing_cookies
                },
                ip_address: getClientIp(req),
                user_agent: req.headers['user-agent']
            });
        } else {
            // Create new consent
            consent = await CookieConsent.create(consentData);
            
            // Log the creation
            await CookieConsentLog.create({
                consent_uuid: consent.uuid,
                action: 'create',
                previous_consent: null,
                new_consent: {
                    consent_type: consent.consent_type,
                    necessary_cookies: consent.necessary_cookies,
                    functional_cookies: consent.functional_cookies,
                    analytics_cookies: consent.analytics_cookies,
                    marketing_cookies: consent.marketing_cookies
                },
                ip_address: getClientIp(req),
                user_agent: req.headers['user-agent']
            });
        }

        res.status(201).json({
            message: 'Cookie consent saved successfully',
            consent
        });
    } catch (error) {
        console.error('Create consent error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getConsent = async (req, res) => {
    try {
        const { user_id, session_id } = req.query;

        // If authenticated, use user_id from token
        const targetUserId = req.user?.id || user_id;

        if (!targetUserId && !session_id) {
            return res.status(400).json({ message: 'Either user_id or session_id is required' });
        }

        const consent = await CookieConsent.getCurrentConsent(targetUserId, session_id);

        if (!consent) {
            return res.status(404).json({ message: 'No active consent found' });
        }

        // Check if consent has expired
        if (consent.expires_at && new Date(consent.expires_at) < new Date()) {
            return res.status(404).json({ message: 'Consent has expired' });
        }

        res.json(consent);
    } catch (error) {
        console.error('Get consent error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateConsent = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { uuid } = req.params;
        const {
            consent_type,
            necessary_cookies,
            functional_cookies,
            analytics_cookies,
            marketing_cookies
        } = req.body;

        // Validate consent_type
        const validTypes = ['accept_all', 'reject_all', 'custom'];
        if (consent_type && !validTypes.includes(consent_type)) {
            return res.status(400).json({ message: 'Invalid consent_type. Must be accept_all, reject_all, or custom' });
        }

        // Get existing consent
        const existingConsent = await CookieConsent.findByUuid(uuid);
        if (!existingConsent) {
            return res.status(404).json({ message: 'Consent not found' });
        }

        // Authorization check: user can only update their own consent
        if (req.user && existingConsent.user_id && existingConsent.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Apply preset values based on consent_type
        let cookieSettings = {};
        if (consent_type === 'accept_all') {
            cookieSettings = {
                necessary_cookies: true,
                functional_cookies: true,
                analytics_cookies: true,
                marketing_cookies: true
            };
        } else if (consent_type === 'reject_all') {
            cookieSettings = {
                necessary_cookies: true,
                functional_cookies: false,
                analytics_cookies: false,
                marketing_cookies: false
            };
        } else {
            // Use provided values for custom
            if (necessary_cookies !== undefined) cookieSettings.necessary_cookies = necessary_cookies;
            if (functional_cookies !== undefined) cookieSettings.functional_cookies = functional_cookies;
            if (analytics_cookies !== undefined) cookieSettings.analytics_cookies = analytics_cookies;
            if (marketing_cookies !== undefined) cookieSettings.marketing_cookies = marketing_cookies;
        }

        const updateData = {
            consent_type: consent_type || existingConsent.consent_type,
            ...cookieSettings,
            consent_version: existingConsent.consent_version + 1,
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        };

        const consent = await CookieConsent.update(uuid, updateData);

        // Log the update
        await CookieConsentLog.create({
            consent_uuid: consent.uuid,
            action: 'update',
            previous_consent: {
                consent_type: existingConsent.consent_type,
                necessary_cookies: existingConsent.necessary_cookies,
                functional_cookies: existingConsent.functional_cookies,
                analytics_cookies: existingConsent.analytics_cookies,
                marketing_cookies: existingConsent.marketing_cookies
            },
            new_consent: {
                consent_type: consent.consent_type,
                necessary_cookies: consent.necessary_cookies,
                functional_cookies: consent.functional_cookies,
                analytics_cookies: consent.analytics_cookies,
                marketing_cookies: consent.marketing_cookies
            },
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        });

        res.json({
            message: 'Cookie consent updated successfully',
            consent
        });
    } catch (error) {
        console.error('Update consent error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteConsent = async (req, res) => {
    try {
        const { uuid } = req.params;

        // Get existing consent
        const existingConsent = await CookieConsent.findByUuid(uuid);
        if (!existingConsent) {
            return res.status(404).json({ message: 'Consent not found' });
        }

        // Authorization check: user can only delete their own consent
        if (req.user && existingConsent.user_id && existingConsent.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Log the withdrawal
        await CookieConsentLog.create({
            consent_uuid: uuid,
            action: 'withdraw',
            previous_consent: {
                consent_type: existingConsent.consent_type,
                necessary_cookies: existingConsent.necessary_cookies,
                functional_cookies: existingConsent.functional_cookies,
                analytics_cookies: existingConsent.analytics_cookies,
                marketing_cookies: existingConsent.marketing_cookies
            },
            new_consent: null,
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        });

        // Mark as withdrawn (set expiry to now)
        await CookieConsent.markAsWithdrawn(uuid);

        res.json({ message: 'Cookie consent withdrawn successfully' });
    } catch (error) {
        console.error('Delete consent error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getConsentLogs = async (req, res) => {
    try {
        const { uuid } = req.params;
        const { limit = 50 } = req.query;

        // Get existing consent
        const existingConsent = await CookieConsent.findByUuid(uuid);
        if (!existingConsent) {
            return res.status(404).json({ message: 'Consent not found' });
        }

        // Authorization check: user can only view their own consent logs
        if (req.user && existingConsent.user_id && existingConsent.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const logs = await CookieConsentLog.findByConsentUuid(uuid, { limit: parseInt(limit) });

        res.json({ logs });
    } catch (error) {
        console.error('Get consent logs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin Analytics APIs
exports.getDailyConsentStats = async (req, res) => {
    try {
        const { pool } = require('../config/database');
        const { days = 30 } = req.query;

        const query = `
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total_consent,
                SUM(CASE WHEN consent_type = 'accept_all' THEN 1 ELSE 0 END) as accept_all,
                SUM(CASE WHEN consent_type = 'reject_all' THEN 1 ELSE 0 END) as reject_all,
                SUM(CASE WHEN consent_type = 'custom' THEN 1 ELSE 0 END) as custom
            FROM cookie_consents
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `;

        const [rows] = await pool.query(query, [parseInt(days)]);
        res.json({ data: rows });
    } catch (error) {
        console.error('Get daily consent stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMonthlyConsentStats = async (req, res) => {
    try {
        const { pool } = require('../config/database');
        const { months = 12 } = req.query;

        const query = `
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as total_consent,
                SUM(CASE WHEN consent_type = 'accept_all' THEN 1 ELSE 0 END) as accept_all,
                SUM(CASE WHEN consent_type = 'reject_all' THEN 1 ELSE 0 END) as reject_all,
                SUM(CASE WHEN consent_type = 'custom' THEN 1 ELSE 0 END) as custom
            FROM cookie_consents
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month DESC
        `;

        const [rows] = await pool.query(query, [parseInt(months)]);
        res.json({ data: rows });
    } catch (error) {
        console.error('Get monthly consent stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getConsentByCountry = async (req, res) => {
    try {
        const { pool } = require('../config/database');

        // Note: This would require IP geolocation data to be stored
        // For now, we'll return a placeholder response
        const query = `
            SELECT 
                'Unknown' as country,
                COUNT(*) as count
            FROM cookie_consents
            GROUP BY country
            ORDER BY count DESC
            LIMIT 10
        `;

        const [rows] = await pool.query(query);
        res.json({ data: rows });
    } catch (error) {
        console.error('Get consent by country error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getConsentByBrowser = async (req, res) => {
    try {
        const { pool } = require('../config/database');

        const query = `
            SELECT 
                CASE 
                    WHEN user_agent LIKE '%Chrome%' THEN 'Chrome'
                    WHEN user_agent LIKE '%Firefox%' THEN 'Firefox'
                    WHEN user_agent LIKE '%Safari%' THEN 'Safari'
                    WHEN user_agent LIKE '%Edge%' THEN 'Edge'
                    WHEN user_agent LIKE '%Opera%' THEN 'Opera'
                    ELSE 'Other'
                END as browser,
                COUNT(*) as count
            FROM cookie_consents
            WHERE user_agent IS NOT NULL
            GROUP BY browser
            ORDER BY count DESC
        `;

        const [rows] = await pool.query(query);
        res.json({ data: rows });
    } catch (error) {
        console.error('Get consent by browser error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getConsentPercentages = async (req, res) => {
    try {
        const { pool } = require('../config/database');

        const query = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN consent_type = 'accept_all' THEN 1 ELSE 0 END) as accept_all,
                SUM(CASE WHEN consent_type = 'reject_all' THEN 1 ELSE 0 END) as reject_all,
                SUM(CASE WHEN consent_type = 'custom' THEN 1 ELSE 0 END) as custom
            FROM cookie_consents
        `;

        const [rows] = await pool.query(query);
        const stats = rows[0];

        const percentages = {
            accept_all: stats.total > 0 ? ((stats.accept_all / stats.total) * 100).toFixed(2) : 0,
            reject_all: stats.total > 0 ? ((stats.reject_all / stats.total) * 100).toFixed(2) : 0,
            custom: stats.total > 0 ? ((stats.custom / stats.total) * 100).toFixed(2) : 0,
            total: stats.total
        };

        res.json({ data: percentages });
    } catch (error) {
        console.error('Get consent percentages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
