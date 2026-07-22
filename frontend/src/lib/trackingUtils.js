import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Generate session UUID
export const generateSessionUuid = () => {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
};

// Parse UTM parameters from URL
export const parseUtmParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    utm_source: urlParams.get('utm_source'),
    utm_medium: urlParams.get('utm_medium'),
    utm_campaign: urlParams.get('utm_campaign'),
    utm_content: urlParams.get('utm_content'),
    utm_term: urlParams.get('utm_term')
  };
};

// Get device information
export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  
  let deviceType = 'desktop';
  if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
    deviceType = /iPad/i.test(userAgent) ? 'tablet' : 'mobile';
  }
  
  return {
    device_type: deviceType,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
};

// Get page type from URL
export const getPageType = (pathname) => {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/article/')) return 'article';
  if (pathname.startsWith('/category/')) return 'category';
  if (pathname === '/search') return 'search';
  if (pathname === '/contact') return 'contact';
  if (pathname.startsWith('/content/')) return 'landing';
  return 'other';
};

// Extract content ID from URL
export const extractContentId = (pathname) => {
  // Match /article/123 or /content/123 patterns
  const articleMatch = pathname.match(/\/article\/(\d+)/);
  const contentMatch = pathname.match(/\/content\/(\d+)/);
  if (articleMatch) return articleMatch[1];
  if (contentMatch) return contentMatch[1];
  return null;
};

// Debounce function for scroll tracking
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for performance
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Calculate scroll percentage
export const getScrollPercentage = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  return docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
};

// Get reading time estimate (200 words per minute)
export const estimateReadingTime = (text) => {
  if (!text) return 0;
  const words = text.split(/\s+/).length;
  return Math.ceil(words / 200);
};

// Tracking API calls
export const trackingApi = {
  // Start visitor session
  startSession: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/tracking/session/start`, data);
      return response.data;
    } catch (error) {
      console.error('Start session error:', error);
      throw error;
    }
  },

  // End visitor session
  endSession: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/tracking/session/end`, data);
      return response.data;
    } catch (error) {
      console.error('End session error:', error);
      throw error;
    }
  },

  // Track page view
  trackPageView: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/tracking/page-view`, data);
      return response.data;
    } catch (error) {
      console.error('Track page view error:', error);
      throw error;
    }
  },

  // Update page view (exit tracking)
  updatePageView: async (data) => {
    try {
      console.log('Updating page view with data:', data);
      const response = await axios.put(`${API_BASE_URL}/tracking/page-view`, data);
      return response.data;
    } catch (error) {
      console.error('Update page view error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Track content engagement
  trackEngagement: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/tracking/engagement`, data);
      return response.data;
    } catch (error) {
      console.error('Track engagement error:', error);
      throw error;
    }
  },

  // Track download
  trackDownload: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/tracking/download`, data);
      return response.data;
    } catch (error) {
      console.error('Track download error:', error);
      throw error;
    }
  },

  // Track search
  trackSearch: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/tracking/search`, data);
      return response.data;
    } catch (error) {
      console.error('Track search error:', error);
      throw error;
    }
  },

  // Track video progress
  trackVideo: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/tracking/video`, data);
      return response.data;
    } catch (error) {
      console.error('Track video error:', error);
      throw error;
    }
  },

  // Track CTA click
  trackCta: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/tracking/cta`, data);
      return response.data;
    } catch (error) {
      console.error('Track CTA error:', error);
      throw error;
    }
  },

  // Track newsletter event
  trackNewsletter: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/tracking/newsletter`, data);
      return response.data;
    } catch (error) {
      console.error('Track newsletter error:', error);
      throw error;
    }
  }
};
