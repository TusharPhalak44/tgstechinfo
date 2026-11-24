/**
 * Comprehensive Country Codes and Business Email Validator
 */

export const COUNTRY_CODES = [
  // Frequently selected countries
  { name: 'India', code: 'IN', dial_code: '+91', flag: '🇮🇳' },
  { name: 'United States', code: 'US', dial_code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', dial_code: '+44', flag: '🇬🇧' },
  { name: 'Canada', code: 'CA', dial_code: '+1', flag: '🇨🇦' },
  { name: 'United Arab Emirates', code: 'AE', dial_code: '+971', flag: '🇦🇪' },
  { name: 'Australia', code: 'AU', dial_code: '+61', flag: '🇦🇺' },
  { name: 'Singapore', code: 'SG', dial_code: '+65', flag: '🇸🇬' },
  { name: 'Germany', code: 'DE', dial_code: '+49', flag: '🇩🇪' },
  { name: 'France', code: 'FR', dial_code: '+33', flag: '🇫🇷' },
  { name: 'Saudi Arabia', code: 'SA', dial_code: '+966', flag: '🇸🇦' },

  // Alphabetical list of other countries
  { name: 'Afghanistan', code: 'AF', dial_code: '+93', flag: '🇦🇫' },
  { name: 'Albania', code: 'AL', dial_code: '+355', flag: '🇦🇱' },
  { name: 'Algeria', code: 'DZ', dial_code: '+213', flag: '🇩🇿' },
  { name: 'Argentina', code: 'AR', dial_code: '+54', flag: '🇦🇷' },
  { name: 'Armenia', code: 'AM', dial_code: '+374', flag: '🇦🇲' },
  { name: 'Austria', code: 'AT', dial_code: '+43', flag: '🇦🇹' },
  { name: 'Bahrain', code: 'BH', dial_code: '+973', flag: '🇧🇭' },
  { name: 'Bangladesh', code: 'BD', dial_code: '+880', flag: '🇧🇩' },
  { name: 'Belgium', code: 'BE', dial_code: '+32', flag: '🇧🇪' },
  { name: 'Brazil', code: 'BR', dial_code: '+55', flag: '🇧🇷' },
  { name: 'Bulgaria', code: 'BG', dial_code: '+359', flag: '🇧🇬' },
  { name: 'Chile', code: 'CL', dial_code: '+56', flag: '🇨🇱' },
  { name: 'China', code: 'CN', dial_code: '+86', flag: '🇨🇳' },
  { name: 'Colombia', code: 'CO', dial_code: '+57', flag: '🇨🇴' },
  { name: 'Czech Republic', code: 'CZ', dial_code: '+420', flag: '🇨🇿' },
  { name: 'Denmark', code: 'DK', dial_code: '+45', flag: '🇩🇰' },
  { name: 'Egypt', code: 'EG', dial_code: '+20', flag: '🇪🇬' },
  { name: 'Finland', code: 'FI', dial_code: '+358', flag: '🇫🇮' },
  { name: 'Greece', code: 'GR', dial_code: '+30', flag: '🇬🇷' },
  { name: 'Hong Kong', code: 'HK', dial_code: '+852', flag: '🇭🇰' },
  { name: 'Hungary', code: 'HU', dial_code: '+36', flag: '🇭🇺' },
  { name: 'Indonesia', code: 'ID', dial_code: '+62', flag: '🇮🇩' },
  { name: 'Ireland', code: 'IE', dial_code: '+353', flag: '🇮🇪' },
  { name: 'Israel', code: 'IL', dial_code: '+972', flag: '🇮🇱' },
  { name: 'Italy', code: 'IT', dial_code: '+39', flag: '🇮🇹' },
  { name: 'Japan', code: 'JP', dial_code: '+81', flag: '🇯🇵' },
  { name: 'Jordan', code: 'JO', dial_code: '+962', flag: '🇯🇴' },
  { name: 'Kenya', code: 'KE', dial_code: '+254', flag: '🇰🇪' },
  { name: 'Kuwait', code: 'KW', dial_code: '+965', flag: '🇰🇼' },
  { name: 'Malaysia', code: 'MY', dial_code: '+60', flag: '🇲🇾' },
  { name: 'Mexico', code: 'MX', dial_code: '+52', flag: '🇲🇽' },
  { name: 'Nepal', code: 'NP', dial_code: '+977', flag: '🇳🇵' },
  { name: 'Netherlands', code: 'NL', dial_code: '+31', flag: '🇳🇱' },
  { name: 'New Zealand', code: 'NZ', dial_code: '+64', flag: '🇳🇿' },
  { name: 'Nigeria', code: 'NG', dial_code: '+234', flag: '🇳🇬' },
  { name: 'Norway', code: 'NO', dial_code: '+47', flag: '🇳🇴' },
  { name: 'Oman', code: 'OM', dial_code: '+968', flag: '🇴🇲' },
  { name: 'Pakistan', code: 'PK', dial_code: '+92', flag: '🇵🇰' },
  { name: 'Peru', code: 'PE', dial_code: '+51', flag: '🇵🇪' },
  { name: 'Philippines', code: 'PH', dial_code: '+63', flag: '🇵🇭' },
  { name: 'Poland', code: 'PL', dial_code: '+48', flag: '🇵🇱' },
  { name: 'Portugal', code: 'PT', dial_code: '+351', flag: '🇵🇹' },
  { name: 'Qatar', code: 'QA', dial_code: '+974', flag: '🇶🇦' },
  { name: 'Romania', code: 'RO', dial_code: '+40', flag: '🇷🇴' },
  { name: 'Russia', code: 'RU', dial_code: '+7', flag: '🇷🇺' },
  { name: 'South Africa', code: 'ZA', dial_code: '+27', flag: '🇿🇦' },
  { name: 'South Korea', code: 'KR', dial_code: '+82', flag: '🇰🇷' },
  { name: 'Spain', code: 'ES', dial_code: '+34', flag: '🇪🇸' },
  { name: 'Sri Lanka', code: 'LK', dial_code: '+94', flag: '🇱🇰' },
  { name: 'Sweden', code: 'SE', dial_code: '+46', flag: '🇸🇪' },
  { name: 'Switzerland', code: 'CH', dial_code: '+41', flag: '🇨🇭' },
  { name: 'Taiwan', code: 'TW', dial_code: '+886', flag: '🇹🇼' },
  { name: 'Thailand', code: 'TH', dial_code: '+66', flag: '🇹🇭' },
  { name: 'Turkey', code: 'TR', dial_code: '+90', flag: '🇹🇷' },
  { name: 'Ukraine', code: 'UA', dial_code: '+380', flag: '🇺🇦' },
  { name: 'Vietnam', code: 'VN', dial_code: '+84', flag: '🇻🇳' },
];

export const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'ymail.com', 'rocketmail.com', 'yahoo.co.in', 'yahoo.co.uk',
  'yahoo.ca', 'yahoo.com.au', 'yahoo.fr', 'yahoo.de', 'yahoo.es', 'yahoo.it',
  'hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.es', 'hotmail.it',
  'outlook.com', 'outlook.in', 'live.com', 'live.co.uk', 'live.fr', 'msn.com',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'aim.com',
  'zoho.com', 'zohomail.com',
  'protonmail.com', 'proton.me', 'pm.me', 'tutanota.com', 'tuta.io', 'tuta.com',
  'mail.com', 'email.com', 'usa.com', 'post.com',
  'gmx.com', 'gmx.net', 'gmx.de',
  'yandex.com', 'yandex.ru', 'ya.ru',
  'rediffmail.com', 'rediff.com',
  'inbox.com',
  'fastmail.com', 'fastmail.fm',
  'mail.ru', 'bk.ru', 'inbox.ru', 'list.ru',
  'lycos.com',
  'mailinator.com', '10minutemail.com', 'tempmail.com', 'guerrillamail.com',
  'throwawaymail.com', 'sharklasers.com', 'getnada.com', 'dispostable.com',
  'yopmail.com', 'trashmail.com'
]);

/**
 * Validates if an email is a corporate / business email (not personal/free).
 * @param {string} email
 * @returns {{ valid: boolean, error?: string, domain?: string }}
 */
export function validateProfessionalEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Work email is required' };
  }

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return { valid: false, error: 'Invalid email address' };
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
 * Format phone with country code for display
 * @param {string} countryCode
 * @param {string} contact
 * @returns {string}
 */
export function formatDisplayPhone(countryCode, contact) {
  const cleanContact = (contact || '').trim();
  if (!cleanContact) return '';

  if (cleanContact.startsWith('+')) {
    return cleanContact;
  }

  const code = (countryCode || '').trim();
  if (code) {
    const formattedCode = code.startsWith('+') ? code : `+${code}`;
    return `${formattedCode} ${cleanContact}`;
  }

  return cleanContact;
}
