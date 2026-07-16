import React, { createContext, useState, useContext, useEffect } from 'react';
import { message } from 'antd';
import { cookieConsentApi } from '../services/cookieConsentApi';
import { generateSessionId, isConsentExpired, getStoredConsent, setStoredConsent, clearStoredConsent } from '../lib/cookieUtils';
import { loadScriptsByConsent, removeScriptsByConsent, updateScriptsByConsent } from '../lib/scriptLoader';

const CookieContext = createContext();

export const useCookieConsent = () => useContext(CookieContext);

const CONSENT_STORAGE_KEY = 'cookie_consent';
const POLICY_VERSION_KEY = 'cookie_policy_version';
const BANNER_VERSION_KEY = 'cookie_banner_version';
const CURRENT_POLICY_VERSION = '1.0';
const CURRENT_BANNER_VERSION = '1.0';

// Tracking script IDs (configure with actual IDs)
const SCRIPT_IDS = {
  googleAnalytics4: import.meta.env.VITE_GA4_ID || '',
  googleTagManager: import.meta.env.VITE_GTM_ID || '',
  hubSpot: import.meta.env.VITE_HUBSPOT_ID || '',
  metaPixel: import.meta.env.VITE_META_PIXEL_ID || '',
  linkedinInsight: import.meta.env.VITE_LINKEDIN_ID || '',
  microsoftClarity: import.meta.env.VITE_CLARITY_ID || ''
};

export const CookieProvider = ({ children }) => {
  const [consent, setConsent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [policyVersion, setPolicyVersion] = useState(CURRENT_POLICY_VERSION);
  const [bannerVersion, setBannerVersion] = useState(CURRENT_BANNER_VERSION);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    initializeCookieConsent();
  }, []);

  const initializeCookieConsent = async () => {
    try {
      // Generate or retrieve session ID for guest users
      let currentSessionId = localStorage.getItem('cookie_session_id');
      if (!currentSessionId) {
        currentSessionId = generateSessionId();
        localStorage.setItem('cookie_session_id', currentSessionId);
      }
      setSessionId(currentSessionId);

      console.log('Initialize Cookie Consent - Session ID:', currentSessionId);

      // Load consent from localStorage first
      const storedConsent = getStoredConsent(CONSENT_STORAGE_KEY);
      console.log('Initialize Cookie Consent - Stored Consent:', storedConsent);

      if (storedConsent) {
        // Check if consent has expired
        if (isConsentExpired(storedConsent.expires_at)) {
          console.log('Initialize Cookie Consent - Consent expired, showing banner');
          clearStoredConsent(CONSENT_STORAGE_KEY);
          setShowBanner(true);
        } else {
          console.log('Initialize Cookie Consent - Valid consent found, hiding banner');
          setConsent(storedConsent);
          // Load scripts based on consent
          loadScriptsByConsent(storedConsent, SCRIPT_IDS);
          // Sync with backend in background
          syncWithBackend(storedConsent, currentSessionId);
          // Don't show banner if consent exists and is valid
          setShowBanner(false);
        }
      } else {
        console.log('Initialize Cookie Consent - No consent found, showing banner');
        // No consent exists, show banner
        setShowBanner(true);
      }

      setLoading(false);
    } catch (error) {
      console.error('Initialize cookie consent error:', error);
      setLoading(false);
      setShowBanner(true);
    }
  };

  const syncWithBackend = async (consentData, currentSessionId) => {
    try {
      // Fetch current consent from backend
      const response = await cookieConsentApi.getConsent({
        session_id: currentSessionId
      });

      if (response.data) {
        // Backend consent takes precedence
        setConsent(response.data);
        setStoredConsent(CONSENT_STORAGE_KEY, response.data);
        localStorage.setItem(POLICY_VERSION_KEY, CURRENT_POLICY_VERSION);
        localStorage.setItem(BANNER_VERSION_KEY, CURRENT_BANNER_VERSION);
      }
    } catch (error) {
      // If backend fails, keep local consent
      console.warn('Backend sync failed, using local consent:', error);
    }
  };

  const acceptAll = async () => {
    try {
      const consentData = {
        consent_type: 'accept_all',
        session_id: sessionId
      };

      console.log('Accept All - Sending consent data:', consentData);
      const response = await cookieConsentApi.createConsent(consentData);
      console.log('Accept All - Full response:', response);
      const newConsent = response.data.consent;

      console.log('Accept All - New Consent:', newConsent);

      if (!newConsent) {
        console.error('Accept All - No consent data in response');
        message.error('Failed to save consent - no data returned');
        return { success: false, error: 'No consent data returned' };
      }

      setConsent(newConsent);
      setStoredConsent(CONSENT_STORAGE_KEY, newConsent);
      localStorage.setItem(POLICY_VERSION_KEY, CURRENT_POLICY_VERSION);
      localStorage.setItem(BANNER_VERSION_KEY, CURRENT_BANNER_VERSION);
      setShowBanner(false);

      console.log('Accept All - Banner hidden, consent stored');

      // Load all scripts for accept all
      loadScriptsByConsent(newConsent, SCRIPT_IDS);

      message.success('All cookies accepted');
      return { success: true, consent: newConsent };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to accept all cookies';
      console.error('Accept All Error:', error);
      console.error('Accept All Error Response:', error.response);
      message.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const rejectAll = async () => {
    try {
      const consentData = {
        consent_type: 'reject_all',
        session_id: sessionId
      };

      const response = await cookieConsentApi.createConsent(consentData);
      const newConsent = response.data.consent;

      setConsent(newConsent);
      setStoredConsent(CONSENT_STORAGE_KEY, newConsent);
      localStorage.setItem(POLICY_VERSION_KEY, CURRENT_POLICY_VERSION);
      localStorage.setItem(BANNER_VERSION_KEY, CURRENT_BANNER_VERSION);
      setShowBanner(false);

      // Remove all non-necessary scripts for reject all
      removeScriptsByConsent(newConsent, SCRIPT_IDS);

      message.success('All non-essential cookies rejected');
      return { success: true, consent: newConsent };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to reject cookies';
      message.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const savePreferences = async (preferences) => {
    try {
      const consentData = {
        consent_type: 'custom',
        necessary_cookies: true, // Always true
        functional_cookies: preferences.functional || false,
        analytics_cookies: preferences.analytics || false,
        marketing_cookies: preferences.marketing || false,
        session_id: sessionId
      };

      const response = await cookieConsentApi.createConsent(consentData);
      const newConsent = response.data.consent;

      setConsent(newConsent);
      setStoredConsent(CONSENT_STORAGE_KEY, newConsent);
      localStorage.setItem(POLICY_VERSION_KEY, CURRENT_POLICY_VERSION);
      localStorage.setItem(BANNER_VERSION_KEY, CURRENT_BANNER_VERSION);
      setShowBanner(false);

      // Load scripts based on custom preferences
      loadScriptsByConsent(newConsent, SCRIPT_IDS);

      message.success('Cookie preferences saved');
      return { success: true, consent: newConsent };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to save preferences';
      message.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const withdrawConsent = async () => {
    if (!consent?.uuid) {
      message.warning('No active consent to withdraw');
      return { success: false, error: 'No active consent' };
    }

    try {
      await cookieConsentApi.deleteConsent(consent.uuid);

      clearStoredConsent(CONSENT_STORAGE_KEY);
      setConsent(null);
      setShowBanner(true);

      // Remove all scripts when consent is withdrawn
      removeScriptsByConsent(null, SCRIPT_IDS);

      message.success('Cookie consent withdrawn');
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to withdraw consent';
      message.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const fetchConsent = async () => {
    try {
      const response = await cookieConsentApi.getConsent({
        session_id: sessionId
      });

      if (response.data) {
        setConsent(response.data);
        setStoredConsent(CONSENT_STORAGE_KEY, response.data);
        return { success: true, consent: response.data };
      }

      return { success: false, error: 'No consent found' };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to fetch consent';
      console.error('Fetch consent error:', error);
      return { success: false, error: errorMsg };
    }
  };

  const resetConsent = () => {
    clearStoredConsent(CONSENT_STORAGE_KEY);
    localStorage.removeItem(POLICY_VERSION_KEY);
    localStorage.removeItem(BANNER_VERSION_KEY);
    setConsent(null);
    setShowBanner(true);
    message.info('Cookie consent reset');
  };

  const updateConsent = async (preferences) => {
    if (!consent?.uuid) {
      return savePreferences(preferences);
    }

    try {
      const consentData = {
        consent_type: 'custom',
        necessary_cookies: true,
        functional_cookies: preferences.functional !== undefined ? preferences.functional : consent.functional_cookies,
        analytics_cookies: preferences.analytics !== undefined ? preferences.analytics : consent.analytics_cookies,
        marketing_cookies: preferences.marketing !== undefined ? preferences.marketing : consent.marketing_cookies
      };

      const response = await cookieConsentApi.updateConsent(consent.uuid, consentData);
      const newConsent = response.data.consent;

      setConsent(newConsent);
      setStoredConsent(CONSENT_STORAGE_KEY, newConsent);

      // Update scripts based on consent changes
      updateScriptsByConsent(newConsent, consent, SCRIPT_IDS);

      message.success('Cookie preferences updated');
      return { success: true, consent: newConsent };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update consent';
      message.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const value = {
    consent,
    loading,
    showBanner,
    policyVersion,
    bannerVersion,
    acceptAll,
    rejectAll,
    savePreferences,
    withdrawConsent,
    fetchConsent,
    resetConsent,
    updateConsent,
    hasConsent: !!consent,
    hasAnalyticsConsent: consent?.analytics_cookies || false,
    hasMarketingConsent: consent?.marketing_cookies || false,
    hasFunctionalConsent: consent?.functional_cookies || false,
    hideBanner: () => {
      console.log('CookieContext - hideBanner called, current showBanner:', showBanner);
      setShowBanner(false);
    },
    forceShowBanner: () => {
      console.log('CookieContext - forceShowBanner called');
      setShowBanner(true);
    }
  };

  return <CookieContext.Provider value={value}>{children}</CookieContext.Provider>;
};
