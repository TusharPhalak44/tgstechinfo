import axios from 'axios';

class PerformanceTracker {
  constructor() {
    this.sessionUuid = null;
    this.consentUuid = null;
    this.metrics = {};
    this.initialized = false;
  }

  initialize(sessionUuid, consentUuid) {
    this.sessionUuid = sessionUuid;
    this.consentUuid = consentUuid;
    this.initialized = true;
    this.startTracking();
  }

  startTracking() {
    if (!this.initialized || typeof window === 'undefined') return;

    // Wait for page to fully load
    if (document.readyState === 'complete') {
      this.collectMetrics();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.collectMetrics(), 1000);
      });
    }
  }

  collectMetrics() {
    if (!window.performance) return;

    try {
      const navEntries = window.performance.getEntriesByType('navigation');
      if (navEntries && navEntries.length > 0) {
        const nav = navEntries[0];

        // Collect basic timing metrics
        this.metrics = {
          ttfb: Math.round(nav.responseStart - nav.requestStart),
          fcp: (nav.domContentLoadedEventEnd - nav.startTime) / 1000,
          dom_content_loaded_time: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
          load_complete_time: Math.round(nav.loadEventEnd - nav.startTime),
          total_resources: window.performance.getEntriesByType('resource').length,
          page_url: window.location.href,
          page_title: document.title,
          device_type: this.detectDevice(),
          browser: this.detectBrowser()
        };

        // Collect LCP (Largest Contentful Paint)
        this.collectLCP();

        // Collect CLS (Cumulative Layout Shift)
        this.collectCLS();

        // Collect FID (First Input Delay)
        this.collectFID();

        // Collect INP (Interaction to Next Paint)
        this.collectINP();

        // Send metrics after a short delay to ensure all metrics are collected
        setTimeout(() => this.sendMetrics(), 2000);
      }
    } catch (error) {
      console.error('Error collecting performance metrics:', error);
    }
  }

  collectLCP() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime / 1000;
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.error('Error collecting LCP:', error);
    }
  }

  collectCLS() {
    if (!('PerformanceObserver' in window)) return;

    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.metrics.cls = clsValue;
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.error('Error collecting CLS:', error);
    }
  }

  collectFID() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.fid = Math.round(entry.processingStart - entry.startTime);
          break; // Only need first input
        }
      });
      observer.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.error('Error collecting FID:', error);
    }
  }

  collectINP() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.inp = Math.round(entry.processingStart - entry.startTime);
        }
      });
      observer.observe({ entryTypes: ['interaction'] });
    } catch (error) {
      console.error('Error collecting INP:', error);
    }
  }

  async sendMetrics() {
    if (!this.sessionUuid || Object.keys(this.metrics).length === 0) return;

    try {
      const cwvData = {
        session_uuid: this.sessionUuid,
        consent_uuid: this.consentUuid,
        lcp: this.metrics.lcp || null,
        fid: this.metrics.fid || null,
        cls: this.metrics.cls || null,
        ttfb: this.metrics.ttfb || null,
        fcp: this.metrics.fcp || null,
        inp: this.metrics.inp || null,
        dom_content_loaded_time: this.metrics.dom_content_loaded_time || null,
        load_complete_time: this.metrics.load_complete_time || null,
        total_resources: this.metrics.total_resources || null,
        page_url: this.metrics.page_url,
        page_title: this.metrics.page_title,
        device_type: this.metrics.device_type,
        browser: this.metrics.browser
      };

      await axios.post('/api/analytics/core-web-vitals', cwvData);
      console.log('Core Web Vitals metrics sent successfully');
    } catch (error) {
      console.error('Error sending Core Web Vitals metrics:', error);
    }
  }

  detectDevice() {
    const userAgent = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
      return 'mobile';
    } else if (/Tablet/i.test(userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  }

  detectBrowser() {
    const userAgent = navigator.userAgent;
    if (/Chrome/i.test(userAgent)) return 'Chrome';
    if (/Firefox/i.test(userAgent)) return 'Firefox';
    if (/Safari/i.test(userAgent)) return 'Safari';
    if (/Edge/i.test(userAgent)) return 'Edge';
    return 'Unknown';
  }
}

// Export singleton instance
const performanceTracker = new PerformanceTracker();
export default performanceTracker;
