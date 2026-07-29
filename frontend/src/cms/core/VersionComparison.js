/**
 * Version Comparison Manager
 * Highlights added, removed, changed content, style changes, widget changes, structure changes with restore capability
 */

class VersionComparisonManager {
  constructor() {
    this.comparisons = new Map();
    this.listeners = [];
  }

  /**
   * Compare two versions
   * @param {Object} versionA - Version A
   * @param {Object} versionB - Version B
   * @returns {Object} Comparison result
   */
  compareVersions(versionA, versionB) {
    const comparison = {
      id: this.generateId(),
      versionA: versionA.id,
      versionB: versionB.id,
      timestamp: Date.now(),
      changes: {
        added: [],
        removed: [],
        modified: [],
        styleChanges: [],
        widgetChanges: [],
        structureChanges: [],
      },
      summary: {
        totalChanges: 0,
        severity: 'low', // low, medium, high
      },
    };

    // Compare content
    comparison.changes.added = this.findAdded(versionA, versionB);
    comparison.changes.removed = this.findRemoved(versionA, versionB);
    comparison.changes.modified = this.findModified(versionA, versionB);

    // Compare styles
    comparison.changes.styleChanges = this.compareStyles(versionA, versionB);

    // Compare widgets
    comparison.changes.widgetChanges = this.compareWidgets(versionA, versionB);

    // Compare structure
    comparison.changes.structureChanges = this.compareStructure(versionA, versionB);

    // Calculate summary
    comparison.summary.totalChanges = 
      comparison.changes.added.length +
      comparison.changes.removed.length +
      comparison.changes.modified.length +
      comparison.changes.styleChanges.length +
      comparison.changes.widgetChanges.length +
      comparison.changes.structureChanges.length;

    comparison.summary.severity = this.calculateSeverity(comparison);

    this.comparisons.set(comparison.id, comparison);
    this.notifyListeners('comparison:created', comparison);
    return comparison;
  }

  /**
   * Find added content
   * @param {Object} versionA - Version A
   * @param {Object} versionB - Version B
   * @returns {Array} Array of added items
   */
  findAdded(versionA, versionB) {
    const added = [];
    const nodesA = new Set(versionA.nodes?.map(n => n.id) || []);
    const nodesB = versionB.nodes || [];

    nodesB.forEach(node => {
      if (!nodesA.has(node.id)) {
        added.push({
          type: 'node',
          id: node.id,
          widget: node.type,
          path: this.getNodePath(node, versionB.nodes),
        });
      }
    });

    return added;
  }

  /**
   * Find removed content
   * @param {Object} versionA - Version A
   * @param {Object} versionB - Version B
   * @returns {Array} Array of removed items
   */
  findRemoved(versionA, versionB) {
    const removed = [];
    const nodesB = new Set(versionB.nodes?.map(n => n.id) || []);
    const nodesA = versionA.nodes || [];

    nodesA.forEach(node => {
      if (!nodesB.has(node.id)) {
        removed.push({
          type: 'node',
          id: node.id,
          widget: node.type,
          path: this.getNodePath(node, versionA.nodes),
        });
      }
    });

    return removed;
  }

  /**
   * Find modified content
   * @param {Object} versionA - Version A
   * @param {Object} versionB - Version B
   * @returns {Array} Array of modified items
   */
  findModified(versionA, versionB) {
    const modified = [];
    const nodesA = versionA.nodes || [];
    const nodesB = versionB.nodes || [];

    const nodesBMap = new Map(nodesB.map(n => [n.id, n]));

    nodesA.forEach(nodeA => {
      const nodeB = nodesBMap.get(nodeA.id);
      if (nodeB && !this.isEqual(nodeA.content, nodeB.content)) {
        modified.push({
          type: 'content',
          id: nodeA.id,
          widget: nodeA.type,
          path: this.getNodePath(nodeA, nodesA),
          oldValue: nodeA.content,
          newValue: nodeB.content,
        });
      }
    });

    return modified;
  }

  /**
   * Compare styles
   * @param {Object} versionA - Version A
   * @param {Object} versionB - Version B
   * @returns {Array} Array of style changes
   */
  compareStyles(versionA, versionB) {
    const styleChanges = [];
    const nodesA = versionA.nodes || [];
    const nodesB = versionB.nodes || [];

    const nodesBMap = new Map(nodesB.map(n => [n.id, n]));

    nodesA.forEach(nodeA => {
      const nodeB = nodesBMap.get(nodeA.id);
      if (nodeB && !this.isEqual(nodeA.styles, nodeB.styles)) {
        const diff = this.getObjectDiff(nodeA.styles, nodeB.styles);
        styleChanges.push({
          type: 'style',
          id: nodeA.id,
          widget: nodeA.type,
          path: this.getNodePath(nodeA, nodesA),
          changes: diff,
        });
      }
    });

    return styleChanges;
  }

  /**
   * Compare widgets
   * @param {Object} versionA - Version A
   * @param {Object} versionB - Version B
   * @returns {Array} Array of widget changes
   */
  compareWidgets(versionA, versionB) {
    const widgetChanges = [];
    const nodesA = versionA.nodes || [];
    const nodesB = versionB.nodes || [];

    const nodesBMap = new Map(nodesB.map(n => [n.id, n]));

    nodesA.forEach(nodeA => {
      const nodeB = nodesBMap.get(nodeA.id);
      if (nodeB && nodeA.type !== nodeB.type) {
        widgetChanges.push({
          type: 'widget',
          id: nodeA.id,
          oldWidget: nodeA.type,
          newWidget: nodeB.type,
          path: this.getNodePath(nodeA, nodesA),
        });
      }
    });

    return widgetChanges;
  }

  /**
   * Compare structure
   * @param {Object} versionA - Version A
   * @param {Object} versionB - Version B
   * @returns {Array} Array of structure changes
   */
  compareStructure(versionA, versionB) {
    const structureChanges = [];
    const nodesA = versionA.nodes || [];
    const nodesB = versionB.nodes || [];

    const nodesBMap = new Map(nodesB.map(n => [n.id, n]));

    nodesA.forEach(nodeA => {
      const nodeB = nodesBMap.get(nodeA.id);
      if (nodeB && nodeA.parentId !== nodeB.parentId) {
        structureChanges.push({
          type: 'structure',
          id: nodeA.id,
          oldParent: nodeA.parentId,
          newParent: nodeB.parentId,
          oldIndex: nodeA.index,
          newIndex: nodeB.index,
        });
      }
    });

    return structureChanges;
  }

  /**
   * Get node path
   * @param {Object} node - Node
   * @param {Array} nodes - All nodes
   * @returns {string} Node path
   */
  getNodePath(node, nodes) {
    const path = [];
    let current = node;
    
    while (current) {
      path.unshift(current.type);
      const parent = nodes.find(n => n.id === current.parentId);
      current = parent;
    }

    return path.join(' > ');
  }

  /**
   * Get object difference
   * @param {Object} objA - Object A
   * @param {Object} objB - Object B
   * @returns {Object} Difference
   */
  getObjectDiff(objA, objB) {
    const diff = {};
    const allKeys = new Set([...Object.keys(objA || {}), ...Object.keys(objB || {})]);

    allKeys.forEach(key => {
      if (!this.isEqual(objA?.[key], objB?.[key])) {
        diff[key] = {
          oldValue: objA?.[key],
          newValue: objB?.[key],
        };
      }
    });

    return diff;
  }

  /**
   * Check if two values are equal
   * @param {any} a - Value A
   * @param {any} b - Value B
   * @returns {boolean} Equal or not
   */
  isEqual(a, b) {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (typeof a !== 'object') return false;
    return JSON.stringify(a) === JSON.stringify(b);
  }

  /**
   * Calculate severity
   * @param {Object} comparison - Comparison result
   * @returns {string} Severity level
   */
  calculateSeverity(comparison) {
    const total = comparison.summary.totalChanges;
    if (total === 0) return 'none';
    if (total < 5) return 'low';
    if (total < 15) return 'medium';
    return 'high';
  }

  /**
   * Get comparison
   * @param {string} id - Comparison ID
   * @returns {Object|null} Comparison or null
   */
  getComparison(id) {
    return this.comparisons.get(id) || null;
  }

  /**
   * Get comparisons for page
   * @param {string} pageId - Page ID
   * @returns {Array} Array of comparisons
   */
  getComparisonsForPage(pageId) {
    return Array.from(this.comparisons.values()).filter(
      comparison => comparison.pageId === pageId
    );
  }

  /**
   * Delete comparison
   * @param {string} id - Comparison ID
   */
  deleteComparison(id) {
    this.comparisons.delete(id);
    this.notifyListeners('comparison:deleted', { id });
  }

  /**
   * Generate a unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `comparison-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

const versionComparisonManager = new VersionComparisonManager();
export default versionComparisonManager;
