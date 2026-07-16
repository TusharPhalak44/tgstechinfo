/**
 * Cookie Consent Utility Functions
 * Handles localStorage operations, session management, and consent validation
 */

/**
 * Generate a unique session ID for guest users
 * @returns {string} Unique session ID
 */
export const generateSessionId = () => {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Check if consent has expired
 * @param {string} expiresAt - Expiry date string
 * @returns {boolean} True if expired, false otherwise
 */
export const isConsentExpired = (expiresAt) => {
  if (!expiresAt) return false;
  const expiryDate = new Date(expiresAt);
  return expiryDate < new Date();
};

/**
 * Get stored consent from localStorage
 * @param {string} storageKey - localStorage key
 * @returns {Object|null} Stored consent object or null
 */
export const getStoredConsent = (storageKey) => {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (error) {
    console.error('Error reading stored consent:', error);
    return null;
  }
};

/**
 * Set consent in localStorage
 * @param {string} storageKey - localStorage key
 * @param {Object} consentData - Consent data to store
 */
export const setStoredConsent = (storageKey, consentData) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(consentData));
  } catch (error) {
    console.error('Error storing consent:', error);
  }
};

/**
 * Clear consent from localStorage
 * @param {string} storageKey - localStorage key
 */
export const clearStoredConsent = (storageKey) => {
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Error clearing stored consent:', error);
  }
};

/**
 * Validate consent data structure
 * @param {Object} consent - Consent object to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidConsent = (consent) => {
  if (!consent || typeof consent !== 'object') return false;
  
  const requiredFields = ['consent_type', 'necessary_cookies'];
  const hasRequiredFields = requiredFields.every(field => field in consent);
  
  const validTypes = ['accept_all', 'reject_all', 'custom'];
  const isValidType = validTypes.includes(consent.consent_type);
  
  return hasRequiredFields && isValidType;
};

/**
 * Get default consent preferences
 * @param {string} consentType - Type of consent ('accept_all', 'reject_all', 'custom')
 * @returns {Object} Default consent preferences
 */
export const getDefaultPreferences = (consentType = 'custom') => {
  const basePreferences = {
    necessary_cookies: true,
    functional_cookies: false,
    analytics_cookies: false,
    marketing_cookies: false
  };

  switch (consentType) {
    case 'accept_all':
      return {
        necessary_cookies: true,
        functional_cookies: true,
        analytics_cookies: true,
        marketing_cookies: true
      };
    case 'reject_all':
      return basePreferences;
    case 'custom':
    default:
      return basePreferences;
  }
};

/**
 * Calculate consent expiry date (default 1 year from now)
 * @param {number} years - Number of years until expiry
 * @returns {string} ISO date string
 */
export const calculateExpiryDate = (years = 1) => {
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + years);
  return expiryDate.toISOString();
};

/**
 * Check if user has given consent for a specific cookie category
 * @param {Object} consent - Consent object
 * @param {string} category - Cookie category ('necessary', 'functional', 'analytics', 'marketing')
 * @returns {boolean} True if consent given, false otherwise
 */
export const hasCategoryConsent = (consent, category) => {
  if (!consent) return false;
  
  const categoryField = `${category}_cookies`;
  return consent[categoryField] === true;
};

/**
 * Merge consent preferences with new preferences
 * @param {Object} currentConsent - Current consent object
 * @param {Object} newPreferences - New preferences to merge
 * @returns {Object} Merged consent object
 */
export const mergeConsentPreferences = (currentConsent, newPreferences) => {
  return {
    ...currentConsent,
    ...newPreferences,
    necessary_cookies: true // Necessary cookies are always required
  };
};

/**
 * Format consent for display
 * @param {Object} consent - Consent object
 * @returns {Object} Formatted consent for UI display
 */
export const formatConsentForDisplay = (consent) => {
  if (!consent) return null;

  return {
    type: consent.consent_type,
    necessary: consent.necessary_cookies,
    functional: consent.functional_cookies,
    analytics: consent.analytics_cookies,
    marketing: consent.marketing_cookies,
    version: consent.consent_version,
    expiry: consent.expires_at,
    updatedAt: consent.updated_at
  };
};

/**
 * Check if consent needs renewal based on policy/banner version
 * @param {string} currentVersion - Current version
 * @param {string} storedVersion - Stored version in localStorage
 * @returns {boolean} True if renewal needed, false otherwise
 */
export const needsConsentRenewal = (currentVersion, storedVersion) => {
  return currentVersion !== storedVersion;
};
