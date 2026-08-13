const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

const BASE_OPTIONS = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/'
};

const COOKIE_MAX_AGES = {
    accessToken: 30 * 60 * 1000,
    refreshToken: 7 * 24 * 60 * 60 * 1000,
    sessionToken: 8 * 60 * 60 * 1000
};

function getCookieOptions(cookieName) {
    const maxAge = COOKIE_MAX_AGES[cookieName];
    if (maxAge !== undefined) {
        return { ...BASE_OPTIONS, maxAge };
    }
    return { ...BASE_OPTIONS };
}

function getClearCookieOptions() {
    return {
        httpOnly: BASE_OPTIONS.httpOnly,
        secure: BASE_OPTIONS.secure,
        sameSite: BASE_OPTIONS.sameSite,
        path: '/'
    };
}

function setAuthCookies(res, tokens) {
    const { accessToken, refreshToken, sessionToken } = tokens;

    if (accessToken) {
        res.cookie('accessToken', accessToken, getCookieOptions('accessToken'));
    }
    if (refreshToken) {
        res.cookie('refreshToken', refreshToken, getCookieOptions('refreshToken'));
    }
    if (sessionToken) {
        res.cookie('sessionToken', sessionToken, getCookieOptions('sessionToken'));
    }
}

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
