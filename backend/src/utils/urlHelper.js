/**
 * Centralized URL Resolution Helper
 * Accurately determines Frontend and Backend Base URLs across local development and production.
 */

function getFrontendUrl() {
    // 1. Development environment (localhost / 127.0.0.1)
    if (process.env.NODE_ENV === 'development') {
        if (process.env.DEV_FRONTEND_URL) {
            return process.env.DEV_FRONTEND_URL.trim().replace(/\/$/, '');
        }

        const rawList = process.env.FRONTEND_URL || '';
        const urls = rawList.split(',').map(u => u.trim()).filter(Boolean);
        const localUrl = urls.find(u => u.startsWith('http://localhost') || u.startsWith('http://127.0.0.1'));
        if (localUrl) {
            return localUrl.replace(/\/$/, '');
        }

        return 'http://localhost:5173';
    }

    // 2. Production environment (Live domain)
    const raw = process.env.SITE_URL || process.env.FRONTEND_URL || 'https://tgstechinfo.com';
    const firstUrl = raw.split(',')[0].trim().replace(/\/$/, '');
    return firstUrl || 'https://tgstechinfo.com';
}

function getBackendUrl() {
    if (process.env.BACKEND_URL) {
        return process.env.BACKEND_URL.trim().replace(/\/$/, '');
    }
    if (process.env.API_URL) {
        return process.env.API_URL.split(',')[0].trim().replace(/\/$/, '');
    }
    return process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://tgstechinfo.com';
}

module.exports = {
    getFrontendUrl,
    getBackendUrl
};

