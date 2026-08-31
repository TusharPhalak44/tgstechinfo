import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

/**
 * Custom hook to track content engagement metrics
 * Tracks scroll depth, time on page, and sends data to backend
 */
const useEngagementTracking = ({ contentId, contentType, pageTitle, enabled = true }) => {
  const startTimeRef = useRef(null);
  const maxScrollDepthRef = useRef(0);
  const scrollMilestonesRef = useRef(new Set());
  const hasSentDataRef = useRef(false);
  const [isTracking, setIsTracking] = useState(false);

  // Get session and consent UUIDs from localStorage
  const getSessionData = () => {
    try {
      const sessionUuid = localStorage.getItem('session_uuid');
      const consentUuid = localStorage.getItem('consent_uuid');
      return { sessionUuid, consentUuid };
    } catch {
      return { sessionUuid: null, consentUuid: null };
    }
  };

  // Track scroll depth
  const handleScroll = () => {
    if (!enabled) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

    // Update max scroll depth
    if (scrollPercent > maxScrollDepthRef.current) {
      maxScrollDepthRef.current = scrollPercent;
    }

    // Track milestones (25%, 50%, 75%, 100%)
    const milestones = [25, 50, 75, 100];
    milestones.forEach(milestone => {
      if (scrollPercent >= milestone && !scrollMilestonesRef.current.has(milestone)) {
        scrollMilestonesRef.current.add(milestone);
        sendEngagementData('scroll_milestone', {
          milestone,
          scroll_depth: scrollPercent
        });
      }
    });
  };

  // Send engagement data to backend
  const sendEngagementData = async (engagementType, additionalData = {}) => {
    if (!enabled || !contentId) return;

    const { sessionUuid, consentUuid } = getSessionData();
    
    if (!sessionUuid) return;

    try {
      const readingTime = startTimeRef.current 
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : 0;

      const engagementData = {
        session_uuid: sessionUuid,
        consent_uuid: consentUuid,
        content_id: contentId,
        engagement_type: engagementType,
        engagement_data: {
          content_type: contentType,
          page_title: pageTitle,
          ...additionalData
        },
        reading_time_seconds: readingTime,
        scroll_depth: maxScrollDepthRef.current,
        max_scroll_depth: maxScrollDepthRef.current,
        exit_position: maxScrollDepthRef.current,
        reading_completed: maxScrollDepthRef.current >= 90
      };

      await axios.post('/api/tracking/engagement', engagementData);
      console.log('Engagement data sent:', engagementType, engagementData);
    } catch (error) {
      console.error('Failed to send engagement data:', error);
    }
  };

  // Initialize tracking on mount
  useEffect(() => {
    if (!enabled || !contentId) return;

    startTimeRef.current = Date.now();
    setIsTracking(true);

    // Send initial view event
    sendEngagementData('page_view', {
      timestamp: new Date().toISOString()
    });

    // Add scroll event listener
    const scrollHandler = () => handleScroll();
    window.addEventListener('scroll', scrollHandler, { passive: true });

    // Set up periodic tracking (every 30 seconds)
    const intervalId = setInterval(() => {
      sendEngagementData('time_update', {
        time_elapsed_seconds: Math.round((Date.now() - startTimeRef.current) / 1000)
      });
    }, 30000);

    return () => {
      window.removeEventListener('scroll', scrollHandler);
      clearInterval(intervalId);
      
      // Send final engagement data on unmount
      if (!hasSentDataRef.current) {
        sendEngagementData('page_exit', {
          total_time_seconds: Math.round((Date.now() - startTimeRef.current) / 1000)
        });
        hasSentDataRef.current = true;
      }
    };
  }, [contentId, enabled]);

  // Handle page visibility changes
  useEffect(() => {
    if (!enabled || !contentId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User left the page - send engagement data
        sendEngagementData('page_hidden', {
          total_time_seconds: Math.round((Date.now() - startTimeRef.current) / 1000)
        });
      } else {
        // User returned to page
        sendEngagementData('page_visible', {
          timestamp: new Date().toISOString()
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [contentId, enabled]);

  // Manual trigger for sending engagement data
  const trackEngagement = (type, data = {}) => {
    sendEngagementData(type, data);
  };

  return {
    isTracking,
    maxScrollDepth: maxScrollDepthRef.current,
    readingTime: startTimeRef.current 
      ? Math.round((Date.now() - startTimeRef.current) / 1000) 
      : 0,
    trackEngagement
  };
};

export default useEngagementTracking;
