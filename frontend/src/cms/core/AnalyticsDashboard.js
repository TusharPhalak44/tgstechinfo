/**
 * Analytics Dashboard Manager
 * Per landing page analytics: views, unique visitors, downloads, conversions, form submissions, CTA clicks, bounce rate, average time, traffic source, top countries, device breakdown
 */

class AnalyticsDashboardManager {
  constructor() {
    this.pageMetrics = new Map();
    this.globalMetrics = new Map();
    this.listeners = [];
  }

  /**
   * Record page view
   * @param {string} pageId - Page ID
   * @param {Object} context - View context
   */
  recordPageView(pageId, context = {}) {
    const metrics = this.getPageMetrics(pageId);
    
    metrics.views++;
    metrics.lastViewedAt = Date.now();
    
    // Track unique visitor
    const visitorId = context.visitorId || this.generateVisitorId();
    if (!metrics.uniqueVisitors.includes(visitorId)) {
      metrics.uniqueVisitors.push(visitorId);
    }

    // Track traffic source
    if (context.source) {
      const sourceKey = context.source.toLowerCase();
      metrics.trafficSources[sourceKey] = (metrics.trafficSources[sourceKey] || 0) + 1;
    }

    // Track device
    if (context.device) {
      metrics.deviceBreakdown[context.device] = (metrics.deviceBreakdown[context.device] || 0) + 1;
    }

    // Track country
    if (context.country) {
      metrics.topCountries[context.country] = (metrics.topCountries[context.country] || 0) + 1;
    }

    this.pageMetrics.set(pageId, metrics);
    this.notifyListeners('page:viewed', { pageId, metrics });
  }

  /**
   * Record download
   * @param {string} pageId - Page ID
   * @param {string} assetId - Asset ID
   * @param {Object} context - Download context
   */
  recordDownload(pageId, assetId, context = {}) {
    const metrics = this.getPageMetrics(pageId);
    
    metrics.downloads++;
    metrics.downloadHistory.push({
      assetId,
      timestamp: Date.now(),
      visitorId: context.visitorId,
    });

    this.pageMetrics.set(pageId, metrics);
    this.notifyListeners('download:recorded', { pageId, assetId });
  }

  /**
   * Record conversion
   * @param {string} pageId - Page ID
   * @param {string} type - Conversion type
   * @param {Object} context - Conversion context
   */
  recordConversion(pageId, type, context = {}) {
    const metrics = this.getPageMetrics(pageId);
    
    metrics.conversions++;
    metrics.conversionsByType[type] = (metrics.conversionsByType[type] || 0) + 1;
    metrics.conversionHistory.push({
      type,
      timestamp: Date.now(),
      visitorId: context.visitorId,
      value: context.value,
    });

    this.pageMetrics.set(pageId, metrics);
    this.notifyListeners('conversion:recorded', { pageId, type });
  }

  /**
   * Record form submission
   * @param {string} pageId - Page ID
   * @param {string} formId - Form ID
   * @param {Object} context - Submission context
   */
  recordFormSubmission(pageId, formId, context = {}) {
    const metrics = this.getPageMetrics(pageId);
    
    metrics.formSubmissions++;
    metrics.formSubmissionsByForm[formId] = (metrics.formSubmissionsByForm[formId] || 0) + 1;
    metrics.formSubmissionHistory.push({
      formId,
      timestamp: Date.now(),
      visitorId: context.visitorId,
    });

    this.pageMetrics.set(pageId, metrics);
    this.notifyListeners('form:submitted', { pageId, formId });
  }

  /**
   * Record CTA click
   * @param {string} pageId - Page ID
   * @param {string} ctaId - CTA ID
   * @param {Object} context - Click context
   */
  recordCTAClick(pageId, ctaId, context = {}) {
    const metrics = this.getPageMetrics(pageId);
    
    metrics.ctaClicks++;
    metrics.ctaClicksByCTA[ctaId] = (metrics.ctaClicksByCTA[ctaId] || 0) + 1;
    metrics.ctaClickHistory.push({
      ctaId,
      timestamp: Date.now(),
      visitorId: context.visitorId,
    });

    this.pageMetrics.set(pageId, metrics);
    this.notifyListeners('cta:clicked', { pageId, ctaId });
  }

  /**
   * Record session duration
   * @param {string} pageId - Page ID
   * @param {number} duration - Session duration in seconds
   * @param {Object} context - Session context
   */
  recordSessionDuration(pageId, duration, context = {}) {
    const metrics = this.getPageMetrics(pageId);
    
    metrics.sessionDurations.push(duration);
    metrics.averageTime = this.calculateAverage(metrics.sessionDurations);

    // Calculate bounce rate (sessions < 30 seconds)
    if (duration < 30) {
      metrics.bounceCount++;
    }
    metrics.bounceRate = (metrics.bounceCount / metrics.views) * 100;

    this.pageMetrics.set(pageId, metrics);
    this.notifyListeners('session:recorded', { pageId, duration });
  }

  /**
   * Get page metrics
   * @param {string} pageId - Page ID
   * @returns {Object} Page metrics
   */
  getPageMetrics(pageId) {
    if (!this.pageMetrics.has(pageId)) {
      this.pageMetrics.set(pageId, {
        pageId,
        views: 0,
        uniqueVisitors: [],
        downloads: 0,
        downloadHistory: [],
        conversions: 0,
        conversionsByType: {},
        conversionHistory: [],
        formSubmissions: 0,
        formSubmissionsByForm: {},
        formSubmissionHistory: [],
        ctaClicks: 0,
        ctaClicksByCTA: {},
        ctaClickHistory: [],
        sessionDurations: [],
        averageTime: 0,
        bounceCount: 0,
        bounceRate: 0,
        trafficSources: {},
        deviceBreakdown: {},
        topCountries: {},
        lastViewedAt: null,
        createdAt: Date.now(),
      });
    }
    return this.pageMetrics.get(pageId);
  }

  /**
   * Get all page metrics
   * @returns {Array} Array of page metrics
   */
  getAllPageMetrics() {
    return Array.from(this.pageMetrics.values());
  }

  /**
   * Get metrics summary for a page
   * @param {string} pageId - Page ID
   * @returns {Object} Metrics summary
   */
  getMetricsSummary(pageId) {
    const metrics = this.getPageMetrics(pageId);
    
    return {
      views: metrics.views,
      uniqueVisitors: metrics.uniqueVisitors.length,
      downloads: metrics.downloads,
      conversions: metrics.conversions,
      formSubmissions: metrics.formSubmissions,
      ctaClicks: metrics.ctaClicks,
      bounceRate: metrics.bounceRate.toFixed(2) + '%',
      averageTime: Math.round(metrics.averageTime) + 's',
      trafficSources: this.sortObject(metrics.trafficSources),
      deviceBreakdown: this.sortObject(metrics.deviceBreakdown),
      topCountries: this.sortObject(metrics.topCountries),
    };
  }

  /**
   * Get metrics for date range
   * @param {string} pageId - Page ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object} Metrics in date range
   */
  getMetricsForDateRange(pageId, startDate, endDate) {
    const metrics = this.getPageMetrics(pageId);
    const start = startDate.getTime();
    const end = endDate.getTime();

    const filterHistory = (history) => {
      return history.filter(item => item.timestamp >= start && item.timestamp <= end);
    };

    return {
      downloads: filterHistory(metrics.downloadHistory).length,
      conversions: filterHistory(metrics.conversionHistory).length,
      formSubmissions: filterHistory(metrics.formSubmissionHistory).length,
      ctaClicks: filterHistory(metrics.ctaClickHistory).length,
    };
  }

  /**
   * Get global metrics
   * @returns {Object} Global metrics
   */
  getGlobalMetrics() {
    const allMetrics = this.getAllPageMetrics();
    
    return {
      totalViews: allMetrics.reduce((sum, m) => sum + m.views, 0),
      totalUniqueVisitors: allMetrics.reduce((sum, m) => sum + m.uniqueVisitors.length, 0),
      totalDownloads: allMetrics.reduce((sum, m) => sum + m.downloads, 0),
      totalConversions: allMetrics.reduce((sum, m) => sum + m.conversions, 0),
      totalFormSubmissions: allMetrics.reduce((sum, m) => sum + m.formSubmissions, 0),
      totalCTAClicks: allMetrics.reduce((sum, m) => sum + m.ctaClicks, 0),
      averageBounceRate: this.calculateAverage(allMetrics.map(m => m.bounceRate)),
      averageTime: this.calculateAverage(allMetrics.map(m => m.averageTime)),
    };
  }

  /**
   * Export metrics as CSV
   * @param {string} pageId - Page ID
   * @returns {string} CSV data
   */
  exportMetricsCSV(pageId) {
    const metrics = this.getPageMetrics(pageId);
    const summary = this.getMetricsSummary(pageId);
    
    const headers = ['Metric', 'Value'];
    const rows = Object.entries(summary).map(([key, value]) => {
      if (typeof value === 'object') {
        return [key, JSON.stringify(value)];
      }
      return [key, value];
    });

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Calculate average
   * @param {Array} values - Array of numbers
   * @returns {number} Average
   */
  calculateAverage(values) {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Sort object by value (descending)
   * @param {Object} obj - Object to sort
   * @returns {Object} Sorted object
   */
  sortObject(obj) {
    return Object.fromEntries(
      Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 10)
    );
  }

  /**
   * Generate visitor ID
   * @returns {string} Visitor ID
   */
  generateVisitorId() {
    return `visitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delete page metrics
   * @param {string} pageId - Page ID
   */
  deletePageMetrics(pageId) {
    this.pageMetrics.delete(pageId);
    this.notifyListeners('metrics:deleted', { pageId });
  }

  /**
   * Subscribe to events
   * @param {Function} listener - Listener function
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify listeners of events
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      listener(event, data);
    });
  }
}

const analyticsDashboardManager = new AnalyticsDashboardManager();
export default analyticsDashboardManager;
