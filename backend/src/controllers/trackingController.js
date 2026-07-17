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

// Middleware to check if analytics cookies are enabled
const checkAnalyticsConsent = async (req, res, next) => {
    try {
        const consent_uuid = req.body.consent_uuid || req.headers['x-consent-uuid'];
        
        if (!consent_uuid) {
            return res.status(400).json({ message: 'Consent UUID is required' });
        }
        
        const consent = await CookieConsent.findByUuid(consent_uuid);
        
        if (!consent) {
            return res.status(404).json({ message: 'Consent not found' });
        }
        
        if (!consent.analytics_cookies) {
            return res.status(403).json({ 
                message: 'Analytics cookies are not enabled. Tracking is disabled.' 
            });
        }
        
        req.consent = consent;
        next();
    } catch (error) {
        console.error('Analytics consent check error:', error);
        res.status(500).json({ message: 'Server error' });
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

        const user_id = req.user?.id || null;
        const ip_address = getClientIp(req);
        const user_agent = req.headers['user-agent'];
        
        // Get device info from user agent
        const deviceInfo = getDeviceInfo(user_agent);
        
        // Get screen resolution, language, timezone from request
        const screen_resolution = req.body.screen_resolution || null;
        const language = req.headers['accept-language']?.split(',')[0] || null;
        const timezone = req.body.timezone || null;

        const sessionData = {
            consent_uuid,
            user_id,
            country: req.body.country || null,
            ...deviceInfo,
            screen_resolution,
            language,
            timezone,
            ip_address,
            referrer,
            landing_page
        };

        const session = await VisitorSession.create(sessionData);

        res.status(201).json({
            message: 'Visitor session started successfully',
            session
        });
    } catch (error) {
        console.error('Start session error:', error);
        res.status(500).json({ message: 'Server error' });
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
            console.log('Session not found:', session_uuid);
            return res.status(404).json({ message: 'Session not found' });
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
        res.status(500).json({ message: 'Server error' });
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

        const pageView = await PageView.create({
            session_uuid,
            consent_uuid,
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
            consent_uuid,
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
        console.error('Track page view error:', error);
        res.status(500).json({ message: 'Server error' });
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
            reading_time_seconds,
            scroll_depth,
            max_scroll_depth,
            exit_position,
            reading_completed
        } = req.body;

        const engagement = await ContentEngagement.create({
            session_uuid,
            consent_uuid,
            content_id,
            engagement_type,
            engagement_data,
            reading_time_seconds,
            scroll_depth,
            max_scroll_depth,
            exit_position,
            reading_completed
        });

        // Add to user journey
        const nextStep = await UserJourney.getNextStepNumber(session_uuid);
        await UserJourney.create({
            session_uuid,
            consent_uuid,
            step_number: nextStep,
            page_url: req.body.page_url || null,
            page_title: req.body.page_title || null,
            content_type: req.body.content_type || null,
            content_id,
            action_type: 'content_view',
            action_data: { engagement_type }
        });

        res.status(201).json({
            message: 'Engagement tracked successfully',
            engagement
        });
    } catch (error) {
        console.error('Track engagement error:', error);
        res.status(500).json({ message: 'Server error' });
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

        const download = await Download.create({
            session_uuid,
            consent_uuid,
            content_id,
            file_id,
            file_name,
            file_type,
            file_size
        });

        // Add to user journey
        const nextStep = await UserJourney.getNextStepNumber(session_uuid);
        await UserJourney.create({
            session_uuid,
            consent_uuid,
            step_number: nextStep,
            page_url: req.body.page_url || null,
            page_title: req.body.page_title || null,
            content_type: req.body.content_type || null,
            content_id,
            action_type: 'download',
            action_data: { file_name, file_type }
        });

        res.status(201).json({
            message: 'Download tracked successfully',
            download
        });
    } catch (error) {
        console.error('Track download error:', error);
        res.status(500).json({ message: 'Server error' });
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

        const search = await SearchHistory.create({
            session_uuid,
            consent_uuid,
            search_keyword,
            search_type,
            results_count,
            selected_result_id,
            selected_result_title,
            search_time_ms
        });

        // Add to user journey
        const nextStep = await UserJourney.getNextStepNumber(session_uuid);
        await UserJourney.create({
            session_uuid,
            consent_uuid,
            step_number: nextStep,
            page_url: req.body.page_url || null,
            page_title: req.body.page_title || null,
            action_type: 'search',
            action_data: { search_keyword, search_type, results_count }
        });

        res.status(201).json({
            message: 'Search tracked successfully',
            search
        });
    } catch (error) {
        console.error('Track search error:', error);
        res.status(500).json({ message: 'Server error' });
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

        const progress = await VideoProgress.create({
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
        });

        res.status(201).json({
            message: 'Video progress tracked successfully',
            progress
        });
    } catch (error) {
        console.error('Track video error:', error);
        res.status(500).json({ message: 'Server error' });
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

        const cta = await CtaClick.create({
            session_uuid,
            consent_uuid,
            content_id,
            cta_type,
            cta_text,
            cta_location
        });

        // Add to user journey
        const nextStep = await UserJourney.getNextStepNumber(session_uuid);
        await UserJourney.create({
            session_uuid,
            consent_uuid,
            step_number: nextStep,
            page_url: req.body.page_url || null,
            page_title: req.body.page_title || null,
            content_type: req.body.content_type || null,
            content_id,
            action_type: 'cta_click',
            action_data: { cta_type, cta_text }
        });

        res.status(201).json({
            message: 'CTA click tracked successfully',
            cta
        });
    } catch (error) {
        console.error('Track CTA error:', error);
        res.status(500).json({ message: 'Server error' });
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

        const event = await NewsletterEvent.create({
            session_uuid,
            consent_uuid,
            event_type,
            email,
            event_data
        });

        // Add to user journey
        const nextStep = await UserJourney.getNextStepNumber(session_uuid);
        await UserJourney.create({
            session_uuid,
            consent_uuid,
            step_number: nextStep,
            page_url: req.body.page_url || null,
            page_title: req.body.page_title || null,
            action_type: 'form_submit',
            action_data: { event_type, email }
        });

        res.status(201).json({
            message: 'Newsletter event tracked successfully',
            event
        });
    } catch (error) {
        console.error('Track newsletter error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    ...exports,
    checkAnalyticsConsent
};
