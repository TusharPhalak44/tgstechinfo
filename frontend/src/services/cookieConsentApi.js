import api from './api';

export const cookieConsentApi = {
  /**
   * Create or update cookie consent
   * @param {Object} consentData - Consent data
   * @param {string} consentData.consent_type - 'accept_all', 'reject_all', or 'custom'
   * @param {boolean} consentData.necessary_cookies - Necessary cookies consent
   * @param {boolean} consentData.functional_cookies - Functional cookies consent
   * @param {boolean} consentData.analytics_cookies - Analytics cookies consent
   * @param {boolean} consentData.marketing_cookies - Marketing cookies consent
   * @param {string} consentData.session_id - Session ID for guest users
   * @returns {Promise} Axios response
   */
  createConsent: (consentData) => {
    return api.post('/api/cookie-consent', consentData);
  },

  /**
   * Get current cookie consent
   * @param {Object} params - Query parameters
   * @param {number} params.user_id - User ID (optional, for authenticated users)
   * @param {string} params.session_id - Session ID (optional, for guest users)
   * @returns {Promise} Axios response
   */
  getConsent: (params = {}) => {
    return api.get('/api/cookie-consent', { params });
  },

  /**
   * Update existing cookie consent
   * @param {string} uuid - Consent UUID
   * @param {Object} consentData - Updated consent data
   * @returns {Promise} Axios response
   */
  updateConsent: (uuid, consentData) => {
    return api.put(`/api/cookie-consent/${uuid}`, consentData);
  },

  /**
   * Withdraw/delete cookie consent
   * @param {string} uuid - Consent UUID
   * @returns {Promise} Axios response
   */
  deleteConsent: (uuid) => {
    return api.delete(`/api/cookie-consent/${uuid}`);
  },

  /**
   * Get consent audit logs
   * @param {string} uuid - Consent UUID
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of logs to retrieve (default: 50)
   * @returns {Promise} Axios response
   */
  getConsentLogs: (uuid, params = {}) => {
    return api.get(`/api/cookie-consent/${uuid}/logs`, { params });
  }
};
