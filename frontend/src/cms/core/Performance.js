/**
 * Performance Manager
 * Optimizes AI requests, asset loading, analytics, workflow
 */

class PerformanceManager {
  constructor() {
    this.metrics = new Map();
    this.cache = new Map();
    this.listeners = [];
    this.optimizations = new Map();
    
    this.initializeOptimizations();
  }

  /**
   * Initialize performance optimizations
   */
  initializeOptimizations() {
    this.optimizations.set('ai_request', {
      enabled: true,
      cacheDuration: 300000, // 5 minutes
      batchSize: 5,
      timeout: 30000,
    });

    this.optimizations.set('asset_loading', {
      enabled: true,
      lazyLoad: true,
      preload: true,
      format: 'webp',
    });

    this.optimizations.set('analytics', {
      enabled: true,
      batchSize: 100,
      flushInterval: 60000,
    });

    this.optimizations.set('workflow', {
      enabled: true,
      debounceTime: 300,
      throttleTime: 1000,
    });
  }

  /**
   * Record a metric
   * @param {string} key - Metric key
   * @param {number} value - Metric value
   */
  recordMetric(key, value) {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const metrics = this.metrics.get(key);
    metrics.push({
      value,
      timestamp: Date.now(),
    });

    // Keep only last 1000 metrics
    if (metrics.length > 1000) {
      metrics.shift();
    }

    this.notifyListeners('metric:recorded', { key, value });
  }

  /**
   * Get metric statistics
   * @param {string} key - Metric key
   * @returns {Object} Metric statistics
   */
  getMetricStats(key) {
    const metrics = this.metrics.get(key) || [];
    if (metrics.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0 };
    }

    const values = metrics.map(m => m.value);
    return {
      count: values.length,
      avg: values.reduce((sum, v) => sum + v, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  /**
   * Cache a value
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  cache(key, value, ttl = 300000) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now(),
    });
  }

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null
   */
  getCached(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  /**
   * Clear cache
   * @param {string} key - Cache key (optional, clears all if not provided)
   */
  clearCache(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Optimize AI request
   * @param {string} type - Request type
   * @param {Function} requestFn - Request function
   * @param {Object} params - Request parameters
   * @returns {Promise<any>} Request result
   */
  async optimizeAIRequest(type, requestFn, params) {
    const optimization = this.optimizations.get('ai_request');
    if (!optimization || !optimization.enabled) {
      return await requestFn(params);
    }

    const cacheKey = `${type}:${JSON.stringify(params)}`;
    const cached = this.getCached(cacheKey);
    if (cached) {
      this.recordMetric('ai_cache_hit', 1);
      return cached;
    }

    this.recordMetric('ai_cache_miss', 1);
    const startTime = Date.now();
    
    try {
      const result = await requestFn(params);
      const duration = Date.now() - startTime;
      
      this.recordMetric('ai_request_duration', duration);
      this.cache(cacheKey, result, optimization.cacheDuration);
      
      return result;
    } catch (error) {
      this.recordMetric('ai_request_error', 1);
      throw error;
    }
  }

  /**
   * Optimize asset loading
   * @param {string} assetUrl - Asset URL
   * @param {Object} options - Loading options
   * @returns {Object} Optimized asset configuration
   */
  optimizeAssetLoading(assetUrl, options = {}) {
    const optimization = this.optimizations.get('asset_loading');
    if (!optimization || !optimization.enabled) {
      return { url: assetUrl };
    }

    return {
      url: assetUrl,
      loading: optimization.lazyLoad ? 'lazy' : 'eager',
      preload: optimization.preload,
      format: optimization.format,
    };
  }

  /**
   * Batch analytics events
   * @param {Array} events - Analytics events
   */
  batchAnalytics(events) {
    const optimization = this.optimizations.get('analytics');
    if (!optimization || !optimization.enabled) {
      events.forEach(event => this.recordMetric('analytics_event', 1));
      return;
    }

    // Batch processing
    this.recordMetric('analytics_batch_size', events.length);
    this.notifyListeners('analytics:batched', { events });
  }

  /**
   * Debounce a function
   * @param {Function} fn - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(fn, delay) {
    const optimization = this.optimizations.get('workflow');
    const actualDelay = optimization?.debounceTime || delay;
    
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), actualDelay);
    };
  }

  /**
   * Throttle a function
   * @param {Function} fn - Function to throttle
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(fn, delay) {
    const optimization = this.optimizations.get('workflow');
    const actualDelay = optimization?.throttleTime || delay;
    
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= actualDelay) {
        lastCall = now;
        return fn(...args);
      }
    };
  }

  /**
   * Get performance report
   * @returns {Object} Performance report
   */
  getPerformanceReport() {
    return {
      ai: {
        cacheHitRate: this.calculateCacheHitRate(),
        avgRequestDuration: this.getMetricStats('ai_request_duration').avg,
        errorRate: this.getMetricStats('ai_request_error').avg,
      },
      analytics: {
        avgBatchSize: this.getMetricStats('analytics_batch_size').avg,
      },
      cache: {
        size: this.cache.size,
      },
      optimizations: Array.from(this.optimizations.entries()).map(([key, value]) => ({
        key,
        ...value,
      })),
    };
  }

  /**
   * Calculate cache hit rate
   * @returns {number} Cache hit rate percentage
   */
  calculateCacheHitRate() {
    const hits = this.getMetricStats('ai_cache_hit').count;
    const misses = this.getMetricStats('ai_cache_miss').count;
    const total = hits + misses;
    
    return total > 0 ? (hits / total) * 100 : 0;
  }

  /**
   * Update optimization
   * @param {string} key - Optimization key
   * @param {Object} updates - Updates to apply
   */
  updateOptimization(key, updates) {
    const optimization = this.optimizations.get(key);
    if (!optimization) return;

    Object.assign(optimization, updates);
    this.optimizations.set(key, optimization);
    this.notifyListeners('optimization:updated', { key, optimization });
  }

  /**
   * Enable optimization
   * @param {string} key - Optimization key
   */
  enableOptimization(key) {
    this.updateOptimization(key, { enabled: true });
  }

  /**
   * Disable optimization
   * @param {string} key - Optimization key
   */
  disableOptimization(key) {
    this.updateOptimization(key, { enabled: false });
  }

  /**
   * Clear old metrics
   * @param {number} hours - Number of hours to keep
   */
  clearOldMetrics(hours = 24) {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    
    for (const [key, metrics] of this.metrics) {
      const filtered = metrics.filter(m => m.timestamp > cutoff);
      this.metrics.set(key, filtered);
    }

    this.notifyListeners('metrics:cleared', { hours });
  }

  /**
   * Clear old cache entries
   * @param {number} hours - Number of hours to keep
   */
  clearOldCache(hours = 1) {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    
    for (const [key, cached] of this.cache) {
      if (cached.createdAt < cutoff) {
        this.cache.delete(key);
      }
    }

    this.notifyListeners('cache:cleared', { hours });
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

const performanceManager = new PerformanceManager();
export default performanceManager;
