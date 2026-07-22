const UAParser = require('ua-parser-js');

/**
 * Parse user agent to extract device information
 */
function parseUserAgent(userAgent) {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    
    return {
        browser: result.browser.name || 'Unknown',
        browser_version: result.browser.version || 'Unknown',
        os: result.os.name || 'Unknown',
        os_version: result.os.version || 'Unknown',
        device_type: getDeviceType(result),
        device_name: getDeviceName(result)
    };
}

/**
 * Determine device type based on UA parser result
 */
function getDeviceType(result) {
    if (result.device.type) {
        return result.device.type; // mobile, tablet, etc.
    }
    if (result.os.name === 'Android' || result.os.name === 'iOS') {
        return 'mobile';
    }
    return 'desktop';
}

/**
 * Generate a friendly device name
 */
function getDeviceName(result) {
    const os = result.os.name || 'Unknown';
    const browser = result.browser.name || 'Unknown';
    
    if (result.device.model) {
        return `${result.device.model} (${os})`;
    }
    
    if (result.device.vendor) {
        return `${result.device.vendor} ${os}`;
    }
    
    return `${browser} on ${os}`;
}

/**
 * Generate a session token
 */
function generateSessionToken() {
    return require('crypto').randomBytes(32).toString('hex');
}

/**
 * Generate a refresh token
 */
function generateRefreshToken() {
    return require('crypto').randomBytes(32).toString('hex');
}

/**
 * Get client IP address from request
 */
function getClientIP(req) {
    return req.ip || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           'unknown';
}

module.exports = {
    parseUserAgent,
    generateSessionToken,
    generateRefreshToken,
    getClientIP
};
