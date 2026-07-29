/**
 * Visibility Manager
 * Manages visibility rules for conditional widget display
 * Supports device, auth, page type, custom, and date range rules
 */

import { visibilityRuleTypes } from '../utils/types';

class VisibilityManager {
  constructor() {
    this.rules = new Map();
    this.listeners = [];
  }

  /**
   * Add a visibility rule to a node
   * @param {string} nodeId - Node ID
   * @param {Object} rule - Visibility rule
   * @param {string} rule.type - Rule type
   * @param {Object} rule.condition - Rule condition
   * @param {boolean} rule.visible - Visibility state
   */
  addRule(nodeId, rule) {
    if (!this.rules.has(nodeId)) {
      this.rules.set(nodeId, []);
    }

    const nodeRules = this.rules.get(nodeId);
    const ruleId = this.generateRuleId();
    
    const newRule = {
      id: ruleId,
      type: rule.type,
      condition: rule.condition,
      visible: rule.visible !== undefined ? rule.visible : true,
      operator: rule.operator || 'and',
      createdAt: Date.now(),
    };

    nodeRules.push(newRule);
    this.notifyListeners('rule:added', { nodeId, rule: newRule });
    return ruleId;
  }

  /**
   * Get rules for a node
   * @param {string} nodeId - Node ID
   * @returns {Array} Array of rules
   */
  getRules(nodeId) {
    return this.rules.get(nodeId) || [];
  }

  /**
   * Update a rule
   * @param {string} nodeId - Node ID
   * @param {string} ruleId - Rule ID
   * @param {Object} updates - Rule updates
   */
  updateRule(nodeId, ruleId, updates) {
    const nodeRules = this.rules.get(nodeId);
    if (!nodeRules) return;

    const ruleIndex = nodeRules.findIndex(r => r.id === ruleId);
    if (ruleIndex > -1) {
      nodeRules[ruleIndex] = { ...nodeRules[ruleIndex], ...updates };
      this.notifyListeners('rule:updated', { nodeId, rule: nodeRules[ruleIndex] });
    }
  }

  /**
   * Remove a rule
   * @param {string} nodeId - Node ID
   * @param {string} ruleId - Rule ID
   */
  removeRule(nodeId, ruleId) {
    const nodeRules = this.rules.get(nodeId);
    if (!nodeRules) return;

    const index = nodeRules.findIndex(r => r.id === ruleId);
    if (index > -1) {
      nodeRules.splice(index, 1);
      this.notifyListeners('rule:removed', { nodeId, ruleId });
    }
  }

  /**
   * Clear all rules for a node
   * @param {string} nodeId - Node ID
   */
  clearRules(nodeId) {
    this.rules.delete(nodeId);
    this.notifyListeners('rules:cleared', { nodeId });
  }

  /**
   * Evaluate visibility for a node
   * @param {string} nodeId - Node ID
   * @param {Object} context - Evaluation context
   * @returns {boolean} Visibility state
   */
  evaluateVisibility(nodeId, context = {}) {
    const nodeRules = this.rules.get(nodeId);
    if (!nodeRules || nodeRules.length === 0) {
      return true; // Default to visible
    }

    const results = nodeRules.map(rule => this.evaluateRule(rule, context));

    // Apply operator (and/or)
    const operator = nodeRules[0].operator || 'and';
    if (operator === 'and') {
      return results.every(r => r === true);
    } else {
      return results.some(r => r === true);
    }
  }

  /**
   * Evaluate a single rule
   * @param {Object} rule - Rule to evaluate
   * @param {Object} context - Evaluation context
   * @returns {boolean} Evaluation result
   */
  evaluateRule(rule, context) {
    switch (rule.type) {
      case 'device':
        return this.evaluateDeviceRule(rule, context);
      case 'auth':
        return this.evaluateAuthRule(rule, context);
      case 'pageType':
        return this.evaluatePageTypeRule(rule, context);
      case 'custom':
        return this.evaluateCustomRule(rule, context);
      case 'dateRange':
        return this.evaluateDateRangeRule(rule, context);
      default:
        return true;
    }
  }

  /**
   * Evaluate device rule
   * @param {Object} rule - Device rule
   * @param {Object} context - Context
   * @returns {boolean} Result
   */
  evaluateDeviceRule(rule, context) {
    const currentDevice = context.device || 'desktop';
    const targetDevice = rule.condition.device;
    
    if (rule.condition.operator === 'equals') {
      return currentDevice === targetDevice;
    } else if (rule.condition.operator === 'notEquals') {
      return currentDevice !== targetDevice;
    }
    
    return true;
  }

  /**
   * Evaluate auth rule
   * @param {Object} rule - Auth rule
   * @param {Object} context - Context
   * @returns {boolean} Result
   */
  evaluateAuthRule(rule, context) {
    const isAuthenticated = context.isAuthenticated || false;
    const targetState = rule.condition.authenticated;
    
    return isAuthenticated === targetState;
  }

  /**
   * Evaluate page type rule
   * @param {Object} rule - Page type rule
   * @param {Object} context - Context
   * @returns {boolean} Result
   */
  evaluatePageTypeRule(rule, context) {
    const currentPageType = context.pageType || 'default';
    const targetType = rule.condition.pageType;
    
    if (rule.condition.operator === 'equals') {
      return currentPageType === targetType;
    } else if (rule.condition.operator === 'notEquals') {
      return currentPageType !== targetType;
    } else if (rule.condition.operator === 'in') {
      return Array.isArray(targetType) && targetType.includes(currentPageType);
    }
    
    return true;
  }

  /**
   * Evaluate custom rule
   * @param {Object} rule - Custom rule
   * @param {Object} context - Context
   * @returns {boolean} Result
   */
  evaluateCustomRule(rule, context) {
    const variable = rule.condition.variable;
    const value = rule.condition.value;
    const operator = rule.condition.operator || 'equals';
    
    const contextValue = this.getContextValue(variable, context);
    
    switch (operator) {
      case 'equals':
        return contextValue === value;
      case 'notEquals':
        return contextValue !== value;
      case 'contains':
        return String(contextValue).includes(value);
      case 'greaterThan':
        return Number(contextValue) > Number(value);
      case 'lessThan':
        return Number(contextValue) < Number(value);
      default:
        return true;
    }
  }

  /**
   * Evaluate date range rule
   * @param {Object} rule - Date range rule
   * @param {Object} context - Context
   * @returns {boolean} Result
   */
  evaluateDateRangeRule(rule, context) {
    const now = context.now || Date.now();
    const startDate = rule.condition.startDate ? new Date(rule.condition.startDate).getTime() : 0;
    const endDate = rule.condition.endDate ? new Date(rule.condition.endDate).getTime() : Infinity;
    
    return now >= startDate && now <= endDate;
  }

  /**
   * Get context value
   * @param {string} variable - Variable path
   * @param {Object} context - Context object
   * @returns {any} Value
   */
  getContextValue(variable, context) {
    const parts = variable.split('.');
    let value = context;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return null;
      }
    }
    
    return value;
  }

  /**
   * Generate CSS for visibility rules
   * @param {string} nodeId - Node ID
   * @param {Object} context - Context
   * @returns {string} CSS string
   */
  generateCSS(nodeId, context) {
    const isVisible = this.evaluateVisibility(nodeId, context);
    
    if (!isVisible) {
      return `display: none;`;
    }
    
    return '';
  }

  /**
   * Generate rule ID
   * @returns {string} Rule ID
   */
  generateRuleId() {
    return `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get statistics
   * @returns {Object} Statistics
   */
  getStats() {
    let totalRules = 0;
    const rulesByType = {};

    this.rules.forEach((nodeRules) => {
      totalRules += nodeRules.length;
      nodeRules.forEach(rule => {
        if (!rulesByType[rule.type]) {
          rulesByType[rule.type] = 0;
        }
        rulesByType[rule.type]++;
      });
    });

    return {
      totalRules,
      totalNodes: this.rules.size,
      rulesByType,
    };
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
   * Clear all rules
   */
  clear() {
    this.rules.clear();
    this.notifyListeners('rules:cleared', { all: true });
  }
}

// Singleton instance
const visibilityManager = new VisibilityManager();

export default visibilityManager;
export { VisibilityManager };
