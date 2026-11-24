/**
 * Validation & Formatting Helper
 */

// List of free / personal consumer and disposable email domains
const FREE_EMAIL_DOMAINS = new Set([
    // Google
    'gmail.com', 'googlemail.com',
    // Yahoo
    'yahoo.com', 'ymail.com', 'rocketmail.com', 'yahoo.co.in', 'yahoo.co.uk',
    'yahoo.ca', 'yahoo.com.au', 'yahoo.fr', 'yahoo.de', 'yahoo.es', 'yahoo.it',
    // Microsoft
    'hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.es', 'hotmail.it',
    'outlook.com', 'outlook.in', 'live.com', 'live.co.uk', 'live.fr', 'msn.com',
    // Apple
    'icloud.com', 'me.com', 'mac.com',
    // AOL
    'aol.com', 'aim.com',
    // Zoho personal
    'zoho.com', 'zohomail.com',
    // Privacy / Encrypted
    'protonmail.com', 'proton.me', 'pm.me', 'tutanota.com', 'tuta.io', 'tuta.com',
    // Webmail & Others
    'mail.com', 'email.com', 'usa.com', 'post.com',
    'gmx.com', 'gmx.net', 'gmx.de',
    'yandex.com', 'yandex.ru', 'ya.ru',
    'rediffmail.com', 'rediff.com',
    'inbox.com',
    'fastmail.com', 'fastmail.fm',
    'mail.ru', 'bk.ru', 'inbox.ru', 'list.ru',
    'lycos.com',
    // Disposable / Temporary
    'mailinator.com', '10minutemail.com', 'tempmail.com', 'guerrillamail.com',
    'throwawaymail.com', 'sharklasers.com', 'getnada.com', 'dispostable.com',
    'yopmail.com', 'trashmail.com'
]);

/**
 * Validates whether an email address is a professional/work email
 * (i.e., not from a free/disposable consumer email provider).
 * @param {string} email 
 * @returns {{ valid: boolean, error?: string, domain?: string }}
 */
function validateProfessionalEmail(email) {
    if (!email || typeof email !== 'string') {
        return { valid: false, error: 'Email address is required.' };
    }

    const trimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
        return { valid: false, error: 'Please enter a valid email address.' };
    }

    const parts = trimmed.split('@');
    if (parts.length !== 2) {
        return { valid: false, error: 'Invalid email format.' };
    }

    const domain = parts[1];

    if (FREE_EMAIL_DOMAINS.has(domain)) {
        return {
            valid: false,
            domain,
            error: `Please enter your business or work email address (e.g. name@company.com). Free email providers like ${domain} are not accepted.`
        };
    }

    return { valid: true, domain };
}

/**
 * Sanitizes and formats a country dial code (e.g. "91" -> "+91", "+1" -> "+1")
 * @param {string} countryCode 
 * @returns {string}
 */
function sanitizeCountryCode(countryCode) {
    if (!countryCode || typeof countryCode !== 'string') return '';
    const clean = countryCode.trim().replace(/[^\d+]/g, '');
    if (!clean) return '';
    return clean.startsWith('+') ? clean : `+${clean}`;
}

/**
 * Combines country code and phone number into a single formatted string
 * e.g. "+91" and "9876543210" -> "+91 9876543210"
 * @param {string} countryCode 
 * @param {string} contact 
 * @returns {string}
 */
function formatFullContact(countryCode, contact) {
    const rawContact = (contact || '').trim();
    if (!rawContact) return '';

    // If contact already starts with '+', keep as-is
    if (rawContact.startsWith('+')) {
        return rawContact;
    }

    const cleanCode = sanitizeCountryCode(countryCode);
    if (cleanCode) {
        // Strip out if user typed dial code without plus e.g. "91 9876..."
        return `${cleanCode} ${rawContact}`;
    }

    return rawContact;
}

module.exports = {
    FREE_EMAIL_DOMAINS,
    validateProfessionalEmail,
    sanitizeCountryCode,
    formatFullContact
};
