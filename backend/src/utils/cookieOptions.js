const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

/**
 * Cookie security configuration
 *
 * COOKIE_SECURE:
 *   - true  → Cookie requires HTTPS
 *   - false → Cookie works over HTTP
 *
 * COOKIE_SAMESITE:
 *   - lax    → Recommended for normal same-site authentication
 *   - strict → More restrictive
 *   - none   → Requires secure=true and HTTPS
 *
 * If the environment variables are not provided:
 *   - Development → secure=false, sameSite=lax
 *   - Production  → secure=true, sameSite=strict
 *
 * For the current server using HTTP:
 *   COOKIE_SECURE=false
 *   COOKIE_SAMESITE=lax
 */

const COOKIE_SECURE =
    process.env.COOKIE_SECURE !== undefined
        ? process.env.COOKIE_SECURE === 'true'
        : isProduction;

const COOKIE_SAMESITE =
    process.env.COOKIE_SAMESITE ||
    (COOKIE_SECURE ? 'strict' : 'lax');

const BASE_OPTIONS = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
    path: '/'
};

const COOKIE_MAX_AGES = {
    accessToken: 30 * 60 * 1000,           // 30 minutes
    refreshToken: 7 * 24 * 60 * 60 * 1000, // 7 days
    sessionToken: 8 * 60 * 60 * 1000       // 8 hours
};

/**
 * Get cookie options for a specific authentication cookie.
 */
function getCookieOptions(cookieName) {
    const maxAge = COOKIE_MAX_AGES[cookieName];

    if (maxAge !== undefined) {
        return {
            ...BASE_OPTIONS,
            maxAge
        };
    }

    return {
        ...BASE_OPTIONS
    };
}

/**
 * Cookie options used when clearing authentication cookies.
 *
 * These options must match the options used when the cookies
 * were originally created.
 */
function getClearCookieOptions() {
    return {
        httpOnly: BASE_OPTIONS.httpOnly,
        secure: BASE_OPTIONS.secure,
        sameSite: BASE_OPTIONS.sameSite,
        path: '/'
    };
}

/**
 * Set all authentication cookies.
 */
function setAuthCookies(res, tokens) {
    const {
        accessToken,
        refreshToken,
        sessionToken
    } = tokens;

    if (accessToken) {
        res.cookie(
            'accessToken',
            accessToken,
            getCookieOptions('accessToken')
        );
    }

    if (refreshToken) {
        res.cookie(
            'refreshToken',
            refreshToken,
            getCookieOptions('refreshToken')
        );
    }

    if (sessionToken) {
        res.cookie(
            'sessionToken',
            sessionToken,
            getCookieOptions('sessionToken')
        );
    }
}

/**
 * Clear all authentication cookies.
 */
function clearAuthCookies(res) {
    const clearOpts = getClearCookieOptions();

    res.clearCookie('accessToken', clearOpts);
    res.clearCookie('refreshToken', clearOpts);
    res.clearCookie('sessionToken', clearOpts);
}

module.exports = {
    BASE_OPTIONS,
    COOKIE_MAX_AGES,
    getCookieOptions,
    getClearCookieOptions,
    setAuthCookies,
    clearAuthCookies
};