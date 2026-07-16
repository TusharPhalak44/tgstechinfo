const CookieConsent = require('../models/CookieConsent');

/**
 * Middleware to check if user has given consent for specific cookie types
 * @param {string} cookieType - The cookie type to check (necessary, functional, analytics, marketing)
 */
exports.checkCookieConsent = (cookieType) => {
    return async (req, res, next) => {
        try {
            const user_id = req.user?.id || null;
            const session_id = req.body.session_id || req.query.session_id || req.headers['x-session-id'] || null;

            if (!user_id && !session_id) {
                return res.status(400).json({ 
                    message: 'Cookie consent check requires either authenticated user or session_id' 
                });
            }

            const consent = await CookieConsent.getCurrentConsent(user_id, session_id);

            if (!consent) {
                return res.status(403).json({ 
                    message: 'No cookie consent found. Please provide cookie consent first.' 
                });
            }

            // Check if consent has expired
            if (consent.expires_at && new Date(consent.expires_at) < new Date()) {
                return res.status(403).json({ 
                    message: 'Cookie consent has expired. Please renew your consent.' 
                });
            }

            // Check specific cookie type consent
            const consentField = `${cookieType}_cookies`;
            if (!consent[consentField]) {
                return res.status(403).json({ 
                    message: `Consent not given for ${cookieType} cookies. Please update your cookie preferences.` 
                });
            }

            // Attach consent to request for use in controllers
            req.cookieConsent = consent;
            next();
        } catch (error) {
            console.error('Cookie consent middleware error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    };
};

/**
 * Middleware to check if user has any valid cookie consent
 */
exports.requireCookieConsent = async (req, res, next) => {
    try {
        const user_id = req.user?.id || null;
        const session_id = req.body.session_id || req.query.session_id || req.headers['x-session-id'] || null;

        if (!user_id && !session_id) {
            // Allow proceeding if no consent is required for guest users
            // This middleware can be used to optionally check consent
            req.cookieConsent = null;
            return next();
        }

        const consent = await CookieConsent.getCurrentConsent(user_id, session_id);

        if (!consent) {
            req.cookieConsent = null;
            return next();
        }

        // Check if consent has expired
        if (consent.expires_at && new Date(consent.expires_at) < new Date()) {
            req.cookieConsent = null;
            return next();
        }

        req.cookieConsent = consent;
        next();
    } catch (error) {
        console.error('Cookie consent middleware error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Middleware to check analytics cookie consent specifically
 */
exports.requireAnalyticsConsent = exports.checkCookieConsent('analytics');

/**
 * Middleware to check marketing cookie consent specifically
 */
exports.requireMarketingConsent = exports.checkCookieConsent('marketing');

/**
 * Middleware to check functional cookie consent specifically
 */
exports.requireFunctionalConsent = exports.checkCookieConsent('functional');
