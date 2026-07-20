const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

// Rate limiter for login endpoint - stricter limits
exports.loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window per IP
    message: {
        message: 'Too many login attempts from this IP. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for trusted IPs if needed
        return false;
    }
});

// Rate limiter for registration endpoint
exports.registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour per IP
    message: {
        message: 'Too many registration attempts from this IP. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter for password reset endpoint
exports.passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset requests per hour per email/IP
    message: {
        message: 'Too many password reset attempts. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// General API rate limiter for authenticated endpoints
exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes per user
    message: {
        message: 'Too many requests. Please slow down.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise IP (with IPv6 support)
        return req.user?.id || ipKeyGenerator(req);
    }
});

// Strict rate limiter for sensitive operations
exports.strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per hour
    message: {
        message: 'Rate limit exceeded for this operation.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
