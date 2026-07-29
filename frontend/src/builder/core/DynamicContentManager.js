/**
 * Dynamic Content Manager
 * Handles dynamic content binding with {{variable}} syntax
 * Supports data sources and variable resolution
 */

class DynamicContentManager {
  constructor() {
    this.dataSources = new Map();
    this.variables = new Map();
    this.resolvers = new Map();
    this.listeners = [];
  }

  /**
   * Register a data source
   * @param {Object} source - Data source configuration
   * @param {string} source.id - Source ID
   * @param {string} source.type - Source type (cms, api, json, webhook, userVariable)
   * @param {Object} source.config - Source configuration
   * @param {Function} source.fetcher - Function to fetch data
   */
  registerDataSource(source) {
    this.dataSources.set(source.id, {
      ...source,
      cachedData: null,
      lastFetched: null,
    });
    this.notifyListeners('dataSource:registered', source);
  }

  /**
   * Get a data source
   * @param {string} id - Data source ID
   * @returns {Object|null} Data source or null
   */
  getDataSource(id) {
    return this.dataSources.get(id) || null;
  }

  /**
   * Get all data sources
   * @returns {Array} Array of data sources
   */
  getDataSources() {
    return Array.from(this.dataSources.values());
  }

  /**
   * Register a variable
   * @param {Object} variable - Variable configuration
   * @param {string} variable.key - Variable key
   * @param {any} variable.value - Variable value
   * @param {string} variable.type - Variable type
   * @param {string} variable.source - Data source ID
   */
  registerVariable(variable) {
    this.variables.set(variable.key, variable);
    this.notifyListeners('variable:registered', variable);
  }

  /**
   * Get a variable
   * @param {string} key - Variable key
   * @returns {Object|null} Variable or null
   */
  getVariable(key) {
    return this.variables.get(key) || null;
  }

  /**
   * Get all variables
   * @returns {Array} Array of variables
   */
  getVariables() {
    return Array.from(this.variables.values());
  }

  /**
   * Register a custom resolver for a variable pattern
   * @param {string} pattern - Variable pattern (e.g., 'page.*')
   * @param {Function} resolver - Resolver function
   */
  registerResolver(pattern, resolver) {
    this.resolvers.set(pattern, resolver);
  }

  /**
   * Parse content for dynamic variables
   * @param {string} content - Content to parse
   * @returns {Array} Array of found variables
   */
  parseVariables(content) {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      variables.push({
        fullMatch: match[0],
        key: match[1].trim(),
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }

    return variables;
  }

  /**
   * Resolve a variable value
   * @param {string} key - Variable key
   * @param {Object} context - Resolution context
   * @returns {any} Resolved value
   */
  resolveVariable(key, context = {}) {
    // Check if variable is registered
    const variable = this.variables.get(key);
    if (variable) {
      return variable.value;
    }

    // Check custom resolvers
    for (const [pattern, resolver] of this.resolvers.entries()) {
      if (this.matchPattern(pattern, key)) {
        try {
          return resolver(key, context);
        } catch (error) {
          console.error(`Resolver error for ${key}:`, error);
          return null;
        }
      }
    }

    // Default built-in variables
    return this.resolveBuiltInVariable(key, context);
  }

  /**
   * Match a pattern against a key
   * @param {string} pattern - Pattern (supports wildcards)
   * @param {string} key - Variable key
   * @returns {boolean} Match result
   */
  matchPattern(pattern, key) {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '[^.]+');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(key);
  }

  /**
   * Resolve built-in variables
   * @param {string} key - Variable key
   * @param {Object} context - Resolution context
   * @returns {any} Resolved value
   */
  resolveBuiltInVariable(key, context) {
    const parts = key.split('.');
    const namespace = parts[0];
    const property = parts.slice(1).join('.');

    switch (namespace) {
      case 'page':
        return context.page?.[property] || null;
      case 'author':
        return context.author?.[property] || null;
      case 'user':
        return context.user?.[property] || null;
      case 'site':
        return context.site?.[property] || null;
      case 'date':
        return this.resolveDateVariable(property);
      default:
        return null;
    }
  }

  /**
   * Resolve date variables
   * @param {string} property - Date property
   * @returns {string} Date value
   */
  resolveDateVariable(property) {
    const now = new Date();
    
    switch (property) {
      case 'now':
        return now.toISOString();
      case 'year':
        return now.getFullYear().toString();
      case 'month':
        return (now.getMonth() + 1).toString();
      case 'day':
        return now.getDate().toString();
      case 'time':
        return now.toLocaleTimeString();
      default:
        return null;
    }
  }

  /**
   * Replace variables in content
   * @param {string} content - Content with variables
   * @param {Object} context - Resolution context
   * @returns {string} Content with resolved variables
   */
  replaceVariables(content, context = {}) {
    if (!content || typeof content !== 'string') {
      return content;
    }

    const variables = this.parseVariables(content);
    let result = content;

    variables.forEach(({ fullMatch, key }) => {
      const value = this.resolveVariable(key, context);
      if (value !== null && value !== undefined) {
        result = result.replace(fullMatch, value);
      }
    });

    return result;
  }

  /**
   * Replace variables in an object recursively
   * @param {Object} obj - Object with variables
   * @param {Object} context - Resolution context
   * @returns {Object} Object with resolved variables
   */
  replaceVariablesInObject(obj, context = {}) {
    if (!obj) return obj;

    if (typeof obj === 'string') {
      return this.replaceVariables(obj, context);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.replaceVariablesInObject(item, context));
    }

    if (typeof obj === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.replaceVariablesInObject(value, context);
      }
      return result;
    }

    return obj;
  }

  /**
   * Fetch data from a data source
   * @param {string} sourceId - Data source ID
   * @returns {Promise<Object>} Fetched data
   */
  async fetchData(sourceId) {
    const source = this.dataSources.get(sourceId);
    if (!source || !source.fetcher) {
      throw new Error(`Data source ${sourceId} not found or has no fetcher`);
    }

    try {
      const data = await source.fetcher();
      source.cachedData = data;
      source.lastFetched = Date.now();
      this.notifyListeners('data:fetched', { sourceId, data });
      return data;
    } catch (error) {
      console.error(`Error fetching data from ${sourceId}:`, error);
      throw error;
    }
  }

  /**
   * Get cached data from a data source
   * @param {string} sourceId - Data source ID
   * @returns {Object|null} Cached data or null
   */
  getCachedData(sourceId) {
    const source = this.dataSources.get(sourceId);
    return source ? source.cachedData : null;
  }

  /**
   * Clear cached data for a data source
   * @param {string} sourceId - Data source ID
   */
  clearCache(sourceId) {
    const source = this.dataSources.get(sourceId);
    if (source) {
      source.cachedData = null;
      source.lastFetched = null;
      this.notifyListeners('cache:cleared', { sourceId });
    }
  }

  /**
   * Clear all cached data
   */
  clearAllCache() {
    this.dataSources.forEach(source => {
      source.cachedData = null;
      source.lastFetched = null;
    });
    this.notifyListeners('cache:cleared', { all: true });
  }

  /**
   * Get available variable suggestions
   * @param {string} prefix - Variable prefix
   * @returns {Array} Array of suggestions
   */
  getVariableSuggestions(prefix = '') {
    const suggestions = [];
    
    // Registered variables
    this.variables.forEach((variable, key) => {
      if (key.startsWith(prefix)) {
        suggestions.push({
          key,
          type: variable.type,
          value: variable.value,
        });
      }
    });

    // Built-in variables
    const builtIn = [
      'page.title',
      'page.description',
      'page.banner',
      'page.tags',
      'author.name',
      'author.email',
      'user.name',
      'user.email',
      'site.name',
      'site.url',
      'date.now',
      'date.year',
      'date.month',
      'date.day',
    ];

    builtIn.forEach(key => {
      if (key.startsWith(prefix)) {
        suggestions.push({
          key,
          type: 'builtin',
          value: null,
        });
      }
    });

    return suggestions;
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

  /**
   * Clear all data sources and variables
   */
  clear() {
    this.dataSources.clear();
    this.variables.clear();
    this.resolvers.clear();
    this.notifyListeners('cleared', {});
  }
}

// Singleton instance
const dynamicContentManager = new DynamicContentManager();

// Register built-in resolvers
dynamicContentManager.registerResolver('page.*', (key, context) => {
  const property = key.replace('page.', '');
  return context.page?.[property] || null;
});

dynamicContentManager.registerResolver('author.*', (key, context) => {
  const property = key.replace('author.', '');
  return context.author?.[property] || null;
});

dynamicContentManager.registerResolver('user.*', (key, context) => {
  const property = key.replace('user.', '');
  return context.user?.[property] || null;
});

dynamicContentManager.registerResolver('site.*', (key, context) => {
  const property = key.replace('site.', '');
  return context.site?.[property] || null;
});

export default dynamicContentManager;
export { DynamicContentManager };
