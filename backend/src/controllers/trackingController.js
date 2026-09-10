const VisitorSession = require('../models/VisitorSession');
const PageView = require('../models/PageView');
const ContentEngagement = require('../models/ContentEngagement');
const Download = require('../models/Download');
const SearchHistory = require('../models/SearchHistory');
const VideoProgress = require('../models/VideoProgress');
const CtaClick = require('../models/CtaClick');
const NewsletterEvent = require('../models/NewsletterEvent');
const UserJourney = require('../models/UserJourney');
const CookieConsent = require('../models/CookieConsent');
const { validationResult } = require('express-validator');
const axios = require('axios');

// Cache public IP location to avoid repeated API calls
let _cachedLocation = null;
const _isPrivateIp = (ip) => {
    if (!ip) return true;
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
    if (/^10\./.test(ip)) return true;
    if (/^192\.168\./.test(ip)) return true;
    if (/^172\.(1[6-9]|2[0-9]|3[01])\./.test(ip)) return true;
    return false;
};

const getCountryFromIp = async (ip) => {
    try {
        if (_isPrivateIp(ip)) {
            const res = await axios.get('http://ip-api.com/json/?fields=country', { timeout: 3000 });
            if (res.data && res.data.country) {
                return res.data.country;
            }
            return 'India';
        }
        const res = await axios.get(`http://ip-api.com/json/${ip}?fields=country`, { timeout: 3000 });
        return res.data?.country || 'India';
    } catch {
        return 'India';
    }
};

// Helper function to get client IP address (reused from cookieConsentController)
const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const ips = forwarded.split(',').map(ip => ip.trim());
        return normalizeIp(ips[0]);
    }
    
    const realIp = req.headers['x-real-ip'];
    if (realIp) {
        return normalizeIp(realIp);
    }
    
    const ip = req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
    return normalizeIp(ip);
};

// Helper function to normalize IP address
const normalizeIp = (ip) => {
    if (!ip) return '127.0.0.1';
    
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
        return '127.0.0.1';
    }
    
    if (ip.startsWith('::ffff:')) {
        return ip.substring(7);
    }
    
    return ip;
};

// Helper function to parse UTM parameters from URL
const parseUtmParams = (url) => {
    try {
        const urlObj = new URL(url, 'http://localhost');
        return {
            utm_source: urlObj.searchParams.get('utm_source'),
            utm_medium: urlObj.searchParams.get('utm_medium'),
            utm_campaign: urlObj.searchParams.get('utm_campaign'),
            utm_content: urlObj.searchParams.get('utm_content'),
            utm_term: urlObj.searchParams.get('utm_term')
        };
    } catch {
        return {
            utm_source: null,
            utm_medium: null,
            utm_campaign: null,
            utm_content: null,
            utm_term: null
        };
    }
};

// Helper function to get device info from user agent
const getDeviceInfo = (userAgent) => {
    const ua = userAgent || '';
    
    let device_type = 'desktop';
    if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
        device_type = /iPad/i.test(ua) ? 'tablet' : 'mobile';
    }
    
    let browser = 'Unknown';
    if (/Chrome/i.test(ua)) browser = 'Chrome';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Safari/i.test(ua)) browser = 'Safari';
    else if (/Edge/i.test(ua)) browser = 'Edge';
    else if (/Opera/i.test(ua)) browser = 'Opera';
    
    let os = 'Unknown';
    if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Mac/i.test(ua)) os = 'macOS';
    else if (/Linux/i.test(ua)) os = 'Linux';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/iOS/i.test(ua)) os = 'iOS';
    
    return { device_type, browser, operating_system: os };
};

// Helper function to check if consent_uuid exists in database to satisfy foreign key constraints
const getValidConsentUuid = async (consent_uuid, ip = '127.0.0.1', ua = 'Unknown') => {
    const targetUuid = consent_uuid || require('crypto').randomUUID();
    try {
        const consent = await CookieConsent.findByUuid(targetUuid);
        if (consent) return targetUuid;
        // Auto-create consent record to satisfy NOT NULL foreign key constraints
        await CookieConsent.create({
            consent_uuid: targetUuid,
            consent_type: 'implicit',
            ip_address: ip,
            user_agent: ua,
            analytics_cookies: true,
            functional_cookies: true,
            advertising_cookies: false
        });
        return targetUuid;
    } catch (err) {
        console.warn('[getValidConsentUuid] Failed to resolve/create consent:', err.message);
        return consent_uuid || null;
    }
};

// Helper function to check if session_uuid exists in database to satisfy foreign key constraints
const getValidSessionUuid = async (session_uuid, consent_uuid, ip = '127.0.0.1', ua = 'Unknown') => {
    if (!session_uuid) return null;
    try {
        const session = await VisitorSession.findByUuid(session_uuid);
        if (session) return session_uuid;
        // Auto-create session record to satisfy foreign key constraints
        const validConsentUuid = await getValidConsentUuid(consent_uuid, ip, ua);
        await VisitorSession.create({
            session_uuid,
            consent_uuid: validConsentUuid,
            ip_address: ip,
            user_agent: ua,
            country: 'India',
            landing_page: '/'
        });
        return session_uuid;
    } catch (err) {
        console.warn('[getValidSessionUuid] Failed to resolve/create session:', err.message);
        return session_uuid;
    }
};

// Middleware to check if analytics cookies are enabled
const checkAnalyticsConsent = async (req, res, next) => {
    try {
        const consent_uuid = req.body.consent_uuid || req.headers['x-consent-uuid'];
        
        if (!consent_uuid) {
            req.consent = null;
            return next();
        }
        
        const consent = await CookieConsent.findByUuid(consent_uuid);
        
        if (!consent) {
            req.consent = null;
            return next();
        }
        
        req.consent = consent;
        next();
    } catch (error) {
        console.error('Analytics consent check error:', error);
        req.consent = null;
        next();
    }
};

// Start a new visitor session
exports.startSession = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            consent_uuid,
            landing_page,
            referrer
        } = req.body;

        const validConsentUuid = await getValidConsentUuid(consent_uuid);

        const user_id = req.user?.id || null;
        const ip_address = getClientIp(req);
        const user_agent = req.headers['user-agent'];
        
        // Get device info from user agent
        const deviceInfo = getDeviceInfo(user_agent);
        
        // Get screen resolution, language, timezone from request
        const screen_resolution = req.body.screen_resolution ? String(req.body.screen_resolution).substring(0, 50) : null;
        const language = req.headers['accept-language']?.split(',')[0] || null;
        const timezone = req.body.timezone ? String(req.body.timezone).substring(0, 100) : null;

        const safeLandingPage = (landing_page || '/').substring(0, 255);
        const safeReferrer = referrer ? String(referrer).substring(0, 255) : null;

        let rawBodyCountry = req.body.country;
        if (typeof rawBodyCountry === 'object' && rawBodyCountry !== null) {
            rawBodyCountry = rawBodyCountry.name || rawBodyCountry.country || null;
        }
        if (typeof rawBodyCountry !== 'string' || rawBodyCountry === '[object Object]' || !rawBodyCountry.trim()) {
            rawBodyCountry = null;
        }

        let resolvedCountry = null;
        if (ip_address && !_isPrivateIp(ip_address)) {
            resolvedCountry = await getCountryFromIp(ip_address);
        }
        if (!resolvedCountry || typeof resolvedCountry !== 'string' || resolvedCountry === '[object Object]') {
            resolvedCountry = rawBodyCountry || await getCountryFromIp(ip_address) || 'India';
        }
        if (typeof resolvedCountry !== 'string' || resolvedCountry === '[object Object]') {
            resolvedCountry = 'India';
        }

        const sessionData = {
            consent_uuid: validConsentUuid,
            user_id,
            country: resolvedCountry || 'India',
            ...deviceInfo,
            screen_resolution,
            language,
            timezone,
            ip_address,
            referrer: safeReferrer,
            landing_page: safeLandingPage
        };

        const session = await VisitorSession.create(sessionData);

        res.status(201).json({
            message: 'Visitor session started successfully',
            session
        });
    } catch (error) {
        console.error('Start session error:', error);
        // Fallback response with session UUID so tracking context doesn't crash
        const fallbackUuid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        res.status(200).json({
            message: 'Visitor session initialized (fallback)',
            session: { session_uuid: fallbackUuid }
        });
    }
};

// End a visitor session
exports.endSession = async (req, res) => {
    try {
        const { session_uuid, exit_page } = req.body;

        console.log('End session request:', { session_uuid, exit_page });

        if (!session_uuid) {
            return res.status(400).json({ message: 'Session UUID is required' });
        }

        const session = await VisitorSession.findByUuid(session_uuid);
        
        if (!session) {
            console.log('Session not found for endSession, acknowledging gracefully:', session_uuid);
            return res.status(200).json({ message: 'Session end acknowledged (session not found)', status: 'ok' });
        }

        const session_end = new Date();
        const total_session_duration = Math.floor((session_end - new Date(session.session_start)) / 1000);

        console.log('Updating session:', { session_uuid, session_end, total_session_duration, exit_page });

        const updatedSession = await VisitorSession.update(session_uuid, {
            session_end,
            total_session_duration,
            exit_page
        });

        console.log('Session updated successfully:', updatedSession);

        res.json({
            message: 'Session ended successfully',
            session: updatedSession
        });
    } catch (error) {
        console.error('End session error:', error);
        res.status(200).json({ message: 'Session end acknowledged (fallback)', status: 'ok' });
    }
};

// Track page view
exports.trackPageView = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            session_uuid,
            consent_uuid,
            page_url,
            page_title,
            page_type,
            content_type,
            content_id
        } = req.body;

        const validConsentUuid = await getValidConsentUuid(consent_uuid);

        const pageView = await PageView.create({
            session_uuid,
            consent_uuid: validConsentUuid,
            page_url,
            page_title,
            page_type,
            content_type,
            content_id
        });

        console.log('Page view created, incrementing page count for session:', session_uuid);

        // Increment page count in session
        await VisitorSession.incrementPageCount(session_uuid);

        // Add to user journey
        const nextStep = await UserJourney.getNextStepNumber(session_uuid);
        await UserJourney.create({
            session_uuid,
            consent_uuid: validConsentUuid,
            step_number: nextStep,
            page_url,
            page_title,
            content_type,
            content_id,
            action_type: 'page_view'
        });

        res.status(201).json({
            message: 'Page view tracked successfully',
            pageView
        });
    } catch (error) {
        console.error('Track page view error:', error.message || error);
        // Fallback 200 response so tracking errors never break frontend UI
        res.status(200).json({
            message: 'Page view tracking acknowledged (fallback)',
            status: 'ok'
        });
    }
};

// Update page view (exit tracking)
exports.updatePageView = async (req, res) => {
    try {
        const { id, time_spent_seconds, scroll_percentage, is_bounce } = req.body;

        if (!id) {
            return res.status(400).json({ message: 'Page view ID is required' });
        }

        const pageView = await PageView.update(id, {
            exited_at: new Date(),
            time_spent_seconds,
            scroll_percentage,
            is_bounce
        });

        res.json({
            message: 'Page view updated successfully',
            pageView
        });
    } catch (error) {
        console.error('Update page view error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Track content engagement
exports.trackEngagement = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            session_uuid,
            consent_uuid,
            content_id,
            engagement_type,
            engagement_data,
            page_url,
            page_title,
            content_type,
            reading_time_seconds,
            scroll_depth,
            max_scroll_depth,
            exit_position,
            reading_completed
        } = req.body;

        const validConsentUuid = await getValidConsentUuid(consent_uuid, getClientIp(req), req.headers['user-agent']);
        const validSessionUuid = await getValidSessionUuid(session_uuid, validConsentUuid, getClientIp(req), req.headers['user-agent']);

        const engagement = await ContentEngagement.create({
            session_uuid: validSessionUuid,
            consent_uuid: validConsentUuid,
            content_id: content_id ? Number(content_id) : null,
            engagement_type,
            engagement_data,
            page_url,
            page_title,
            content_type,
            reading_time_seconds,
            scroll_depth,
            max_scroll_depth,
            exit_position,
            reading_completed
        });

        // Add to user journey
        if (validSessionUuid) {
            try {
                const nextStep = await UserJourney.getNextStepNumber(validSessionUuid);
                await UserJourney.create({
                    session_uuid: validSessionUuid,
                    consent_uuid: validConsentUuid,
                    step_number: nextStep,
                    page_url: req.body.page_url || null,
                    page_title: req.body.page_title || null,
                    content_type: req.body.content_type || null,
                    content_id: content_id ? Number(content_id) : null,
                    action_type: 'content_view',
                    action_data: { engagement_type }
                });
            } catch (journeyErr) {
                console.warn('[trackEngagement] Journey log warning:', journeyErr.message);
            }
        }

        res.status(201).json({
            message: 'Engagement tracked successfully',
            engagement
        });
    } catch (error) {
        console.error('Track engagement error:', error.message || error);
        res.status(200).json({
            message: 'Engagement tracking acknowledged (fallback)',
            status: 'ok'
        });
    }
};

// Track download
exports.trackDownload = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            session_uuid,
            consent_uuid,
            content_id,
            file_id,
            file_name,
            file_type,
            file_size
        } = req.body;

        const validConsentUuid = await getValidConsentUuid(consent_uuid, getClientIp(req), req.headers['user-agent']);
        const validSessionUuid = await getValidSessionUuid(session_uuid, validConsentUuid, getClientIp(req), req.headers['user-agent']);

        const download = await Download.create({
            session_uuid: validSessionUuid,
            consent_uuid: validConsentUuid,
            content_id: content_id ? Number(content_id) : null,
            file_id,
            file_name,
            file_type,
            file_size
        });

        // Add to user journey
        if (validSessionUuid) {
            try {
                const nextStep = await UserJourney.getNextStepNumber(validSessionUuid);
                await UserJourney.create({
                    session_uuid: validSessionUuid,
                    consent_uuid: validConsentUuid,
                    step_number: nextStep,
                    page_url: req.body.page_url || null,
                    page_title: req.body.page_title || null,
                    content_type: req.body.content_type || null,
                    content_id: content_id ? Number(content_id) : null,
                    action_type: 'download',
                    action_data: { file_name, file_type }
                });
            } catch (jErr) {
                console.warn('[trackDownload] UserJourney step skipped:', jErr.message);
            }
        }

        res.status(201).json({
            message: 'Download tracked successfully',
            download
        });
    } catch (error) {
        console.error('Track download error:', error.message || error);
        res.status(200).json({ message: 'Download tracking acknowledged (fallback)', status: 'ok' });
    }
};

// Track search
exports.trackSearch = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            session_uuid,
            consent_uuid,
            search_keyword,
            search_type,
            results_count,
            selected_result_id,
            selected_result_title,
            search_time_ms
        } = req.body;

        const validConsentUuid = await getValidConsentUuid(consent_uuid, getClientIp(req), req.headers['user-agent']);
        const validSessionUuid = await getValidSessionUuid(session_uuid, validConsentUuid, getClientIp(req), req.headers['user-agent']);

        const search = await SearchHistory.create({
            session_uuid: validSessionUuid,
            consent_uuid: validConsentUuid,
            search_keyword,
            search_type,
            results_count,
            selected_result_id,
            selected_result_title,
            search_time_ms
        });

        // Add to user journey
        if (validSessionUuid) {
            try {
                const nextStep = await UserJourney.getNextStepNumber(validSessionUuid);
                await UserJourney.create({
                    session_uuid: validSessionUuid,
                    consent_uuid: validConsentUuid,
                    step_number: nextStep,
                    page_url: req.body.page_url || null,
                    page_title: req.body.page_title || null,
                    action_type: 'search',
                    action_data: { search_keyword, search_type, results_count }
                });
            } catch (jErr) {
                console.warn('[trackSearch] UserJourney step skipped:', jErr.message);
            }
        }

        res.status(201).json({
            message: 'Search tracked successfully',
            search
        });
    } catch (error) {
        console.error('Track search error:', error.message || error);
        res.status(200).json({ message: 'Search tracking acknowledged (fallback)', status: 'ok' });
    }
};

// Track video progress
exports.trackVideo = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            session_uuid,
            consent_uuid,
            content_id,
            video_started_at,
            video_25_percent_at,
            video_50_percent_at,
            video_75_percent_at,
            video_completed_at,
            duration_watched_seconds,
            total_duration_seconds
        } = req.body;

        const validConsentUuid = await getValidConsentUuid(consent_uuid, getClientIp(req), req.headers['user-agent']);
        const validSessionUuid = await getValidSessionUuid(session_uuid, validConsentUuid, getClientIp(req), req.headers['user-agent']);

        const progress = await VideoProgress.create({
            session_uuid: validSessionUuid,
            consent_uuid: validConsentUuid,
            content_id: content_id ? Number(content_id) : null,
            video_started_at,
            video_25_percent_at,
            video_50_percent_at,
            video_75_percent_at,
            video_completed_at,
            duration_watched_seconds,
            total_duration_seconds
        });

        res.status(201).json({
            message: 'Video progress tracked successfully',
            progress
        });
    } catch (error) {
        console.error('Track video error:', error.message || error);
        res.status(200).json({ message: 'Video tracking acknowledged (fallback)', status: 'ok' });
    }
};

// Track CTA click
exports.trackCta = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            session_uuid,
            consent_uuid,
            content_id,
            cta_type,
            cta_text,
            cta_location
        } = req.body;

        const validConsentUuid = await getValidConsentUuid(consent_uuid, getClientIp(req), req.headers['user-agent']);
        const validSessionUuid = await getValidSessionUuid(session_uuid, validConsentUuid, getClientIp(req), req.headers['user-agent']);

        const cta = await CtaClick.create({
            session_uuid: validSessionUuid,
            consent_uuid: validConsentUuid,
            content_id: content_id ? Number(content_id) : null,
            cta_type,
            cta_text,
            cta_location
        });

        // Add to user journey
        if (validSessionUuid) {
            try {
                const nextStep = await UserJourney.getNextStepNumber(validSessionUuid);
                await UserJourney.create({
                    session_uuid: validSessionUuid,
                    consent_uuid: validConsentUuid,
                    step_number: nextStep,
                    page_url: req.body.page_url || null,
                    page_title: req.body.page_title || null,
                    content_type: req.body.content_type || null,
                    content_id: content_id ? Number(content_id) : null,
                    action_type: 'cta_click',
                    action_data: { cta_type, cta_text }
                });
            } catch (jErr) {
                console.warn('[trackCta] UserJourney step skipped:', jErr.message);
            }
        }

        res.status(201).json({
            message: 'CTA click tracked successfully',
            cta
        });
    } catch (error) {
        console.error('Track CTA error:', error.message || error);
        res.status(200).json({ message: 'CTA tracking acknowledged (fallback)', status: 'ok' });
    }
};

// Track newsletter event
exports.trackNewsletter = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            session_uuid,
            consent_uuid,
            event_type,
            email,
            event_data
        } = req.body;

        const validConsentUuid = await getValidConsentUuid(consent_uuid, getClientIp(req), req.headers['user-agent']);
        const validSessionUuid = await getValidSessionUuid(session_uuid, validConsentUuid, getClientIp(req), req.headers['user-agent']);

        const event = await NewsletterEvent.create({
            session_uuid: validSessionUuid,
            consent_uuid: validConsentUuid,
            event_type,
            email,
            event_data
        });

        // Add to user journey
        if (validSessionUuid) {
            try {
                const nextStep = await UserJourney.getNextStepNumber(validSessionUuid);
                await UserJourney.create({
                    session_uuid: validSessionUuid,
                    consent_uuid: validConsentUuid,
                    step_number: nextStep,
                    page_url: req.body.page_url || null,
                    page_title: req.body.page_title || null,
                    action_type: 'form_submit',
                    action_data: { event_type, email }
                });
            } catch (jErr) {
                console.warn('[trackNewsletter] UserJourney step skipped:', jErr.message);
            }
        }

        res.status(201).json({
            message: 'Newsletter event tracked successfully',
            event
        });
    } catch (error) {
        console.error('Track newsletter error:', error.message || error);
        res.status(200).json({ message: 'Newsletter tracking acknowledged (fallback)', status: 'ok' });
    }
};

module.exports = {
    ...exports,
    checkAnalyticsConsent
};
