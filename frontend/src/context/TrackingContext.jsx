import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useCookieConsent } from './CookieContext';
import { trackingApi, generateSessionUuid, parseUtmParams, getDeviceInfo, getPageType, extractContentId, debounce, throttle, getScrollPercentage } from '../lib/trackingUtils';

const TrackingContext = createContext(null);

export const useTracking = () => {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
};

export const TrackingProvider = ({ children }) => {
  const location = useLocation();
  const { consent, hasAnalyticsConsent } = useCookieConsent();
  
  const [sessionUuid, setSessionUuid] = useState(null);
  const [currentPageViewId, setCurrentPageViewId] = useState(null);
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(false);
  const [pageEnterTime, setPageEnterTime] = useState(null);
  
  const scrollTrackingRef = useRef(null);
  const sessionInitializedRef = useRef(false);

  // Initialize tracking session when analytics consent is granted
  useEffect(() => {
    if (hasAnalyticsConsent && consent && !sessionInitializedRef.current) {
      initializeSession();
      sessionInitializedRef.current = true;
    } else if (!hasAnalyticsConsent) {
      // Disable tracking if analytics consent is revoked
      setIsTrackingEnabled(false);
      sessionInitializedRef.current = false;
    }
  }, [hasAnalyticsConsent, consent]);

  // Update global tracking variables when session or consent changes
  useEffect(() => {
    if (sessionUuid) {
      window.__SESSION_UUID = sessionUuid;
    }
    if (consent?.uuid) {
      window.__CONSENT_UUID = consent.uuid;
    }
  }, [sessionUuid, consent]);

  const initializeSession = async () => {
    try {
      const deviceInfo = getDeviceInfo();
      const utmParams = parseUtmParams();
      
      const sessionData = {
        consent_uuid: consent.uuid,
        landing_page: window.location.href,
        referrer: document.referrer,
        ...deviceInfo,
        ...utmParams
      };

      const response = await trackingApi.startSession(sessionData);
      setSessionUuid(response.session.session_uuid);
      setIsTrackingEnabled(true);
      
      // Store session UUID in localStorage for persistence
      localStorage.setItem('tracking_session_uuid', response.session.session_uuid);
      
      console.log('Tracking session initialized:', response.session.session_uuid);
    } catch (error) {
      console.error('Failed to initialize tracking session:', error);
    }
  };

  // Track page view on route change
  useEffect(() => {
    if (!isTrackingEnabled || !sessionUuid) return;

    console.log('Route changed, tracking page view:', location.pathname);
    trackPageView();
  }, [location.pathname, isTrackingEnabled, sessionUuid]);

  const trackPageView = async () => {
    try {
      const pageType = getPageType(location.pathname);
      const contentId = extractContentId(location.pathname);
      
      const pageViewData = {
        session_uuid: sessionUuid,
        consent_uuid: consent.uuid,
        page_url: window.location.href,
        page_title: document.title,
        page_type: pageType,
        content_type: pageType === 'article' ? 'article' : null,
        content_id: contentId
      };

      const response = await trackingApi.trackPageView(pageViewData);
      setCurrentPageViewId(response.pageView.id);
      setPageEnterTime(Date.now());
      
      console.log('Page view tracked:', response.pageView);
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  };

  // Track page exit on route change and visibility change
  useEffect(() => {
    const updateCurrentPageView = () => {
      if (currentPageViewId && pageEnterTime) {
        const timeSpent = Math.floor((Date.now() - pageEnterTime) / 1000);
        const scrollPercentage = getScrollPercentage();
        
        console.log('Updating page view:', { currentPageViewId, timeSpent, scrollPercentage, isTrackingEnabled });
        
        trackingApi.updatePageView({
          id: currentPageViewId,
          time_spent_seconds: timeSpent,
          scroll_percentage: scrollPercentage,
          is_bounce: timeSpent < 10 // Consider bounce if less than 10 seconds
        }).catch(err => console.error('Failed to update page view:', err));
      }
    };

    const endCurrentSession = () => {
      if (sessionUuid) {
        console.log('Ending session:', sessionUuid, 'exit_page:', window.location.href);
        
        // Use navigator.sendBeacon for reliable session ending
        const data = new Blob([JSON.stringify({
          session_uuid: sessionUuid,
          exit_page: window.location.href
        })], { type: 'application/json' });
        
        navigator.sendBeacon(`/api/tracking/session/end`, data);
      }
    };

    // Track on visibility change (tab hidden) - only update page view, don't end session
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateCurrentPageView();
      }
    };

    // Track on beforeunload using beacon for reliability
    const handleBeforeUnload = () => {
      if (currentPageViewId && pageEnterTime) {
        const timeSpent = Math.floor((Date.now() - pageEnterTime) / 1000);
        const scrollPercentage = getScrollPercentage();
        
        console.log('Sending beacon for page view:', { currentPageViewId, timeSpent, scrollPercentage });
        
        // Use navigator.sendBeacon for reliable sending during page unload
        const data = new Blob([JSON.stringify({
          id: currentPageViewId,
          time_spent_seconds: timeSpent,
          scroll_percentage: scrollPercentage,
          is_bounce: timeSpent < 10
        })], { type: 'application/json' });
        
        navigator.sendBeacon(`/api/tracking/page-view/update`, data);
      }
      
      // End session only on actual page unload (leaving the site)
      endCurrentSession();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Update on unmount (route change) - but don't end session
      updateCurrentPageView();
    };
  }, [currentPageViewId, pageEnterTime, isTrackingEnabled, sessionUuid]);

  // Scroll tracking (throttled)
  useEffect(() => {
    if (!isTrackingEnabled || !currentPageViewId) return;

    const handleScroll = throttle(() => {
      const scrollPercentage = getScrollPercentage();
      // Only track significant scroll events
      if (scrollPercentage > 0) {
        // Could send scroll updates to backend
        // Currently just tracking on exit for performance
      }
    }, 1000);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isTrackingEnabled, currentPageViewId]);

  // End session on component unmount
  useEffect(() => {
    return () => {
      if (sessionUuid && isTrackingEnabled) {
        trackingApi.endSession({
          session_uuid: sessionUuid,
          exit_page: window.location.href
        }).catch(err => console.error('Failed to end session:', err));
      }
    };
  }, [sessionUuid, isTrackingEnabled]);

  // Manual tracking functions
  const trackEngagement = async (engagementData) => {
    if (!isTrackingEnabled || !sessionUuid) {
      console.warn('Tracking is not enabled');
      return;
    }

    try {
      const data = {
        session_uuid: sessionUuid,
        consent_uuid: consent.uuid,
        page_url: window.location.href,
        page_title: document.title,
        ...engagementData
      };

      const response = await trackingApi.trackEngagement(data);
      console.log('Engagement tracked:', response.engagement);
      return response;
    } catch (error) {
      console.error('Failed to track engagement:', error);
      throw error;
    }
  };

  const trackDownload = async (downloadData) => {
    if (!isTrackingEnabled || !sessionUuid) {
      console.warn('Tracking is not enabled');
      return;
    }

    try {
      const data = {
        session_uuid: sessionUuid,
        consent_uuid: consent.uuid,
        page_url: window.location.href,
        page_title: document.title,
        ...downloadData
      };

      const response = await trackingApi.trackDownload(data);
      console.log('Download tracked:', response.download);
      return response;
    } catch (error) {
      console.error('Failed to track download:', error);
      throw error;
    }
  };

  const trackSearch = async (searchData) => {
    if (!isTrackingEnabled || !sessionUuid) {
      console.warn('Tracking is not enabled');
      return;
    }

    try {
      const data = {
        session_uuid: sessionUuid,
        consent_uuid: consent.uuid,
        page_url: window.location.href,
        page_title: document.title,
        ...searchData
      };

      const response = await trackingApi.trackSearch(data);
      console.log('Search tracked:', response.search);
      return response;
    } catch (error) {
      console.error('Failed to track search:', error);
      throw error;
    }
  };

  const trackCta = async (ctaData) => {
    if (!isTrackingEnabled || !sessionUuid) {
      console.warn('Tracking is not enabled');
      return;
    }

    try {
      const data = {
        session_uuid: sessionUuid,
        consent_uuid: consent.uuid,
        page_url: window.location.href,
        page_title: document.title,
        ...ctaData
      };

      const response = await trackingApi.trackCta(data);
      console.log('CTA tracked:', response.cta);
      return response;
    } catch (error) {
      console.error('Failed to track CTA:', error);
      throw error;
    }
  };

  const trackNewsletter = async (newsletterData) => {
    if (!isTrackingEnabled || !sessionUuid) {
      console.warn('Tracking is not enabled');
      return;
    }

    try {
      const data = {
        session_uuid: sessionUuid,
        consent_uuid: consent.uuid,
        page_url: window.location.href,
        page_title: document.title,
        ...newsletterData
      };

      const response = await trackingApi.trackNewsletter(data);
      console.log('Newsletter event tracked:', response.event);
      return response;
    } catch (error) {
      console.error('Failed to track newsletter event:', error);
      throw error;
    }
  };

  const value = {
    isTrackingEnabled,
    sessionUuid,
    trackEngagement,
    trackDownload,
    trackSearch,
    trackCta,
    trackNewsletter
  };

  return (
    <TrackingContext.Provider value={value}>
      {children}
    </TrackingContext.Provider>
  );
};

export default TrackingContext;
