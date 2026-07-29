/**
 * Global Component Manager
 * Manages reusable global components (widgets, containers, sections)
 * Allows saving, loading, and updating global components across pages
 */

class GlobalComponentManager {
  constructor() {
    this.components = new Map();
    this.categories = new Map();
    this.listeners = [];
  }

  /**
   * Save a component as global
   * @param {Object} component - Component data
   * @param {string} component.id - Component ID
   * @param {string} component.name - Component name
   * @param {string} component.type - Component type (widget, container, section)
   * @param {Object} component.data - Component node data
   * @param {string} component.category - Component category
   * @param {string} component.thumbnail - Component thumbnail URL
   * @param {Object} component.metadata - Additional metadata
   * @returns {string} Component ID
   */
  saveComponent(component) {
    const id = component.id || this.generateId();
    
    const globalComponent = {
      id,
      name: component.name || 'Untitled Component',
      type: component.type || 'widget',
      data: component.data,
      category: component.category || 'general',
      thumbnail: component.thumbnail || null,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: 'current-user',
        version: '1.0.0',
        ...component.metadata,
      },
      instances: [], // Track instances of this component
    };

    this.components.set(id, globalComponent);

    // Register category
    if (!this.categories.has(globalComponent.category)) {
      this.categories.set(globalComponent.category, []);
    }
    const categoryComponents = this.categories.get(globalComponent.category);
    if (!categoryComponents.includes(id)) {
      categoryComponents.push(id);
    }

    this.notifyListeners('component:saved', globalComponent);
    return id;
  }

  /**
   * Get a component by ID
   * @param {string} id - Component ID
   * @returns {Object|null} Component or null
   */
  getComponent(id) {
    return this.components.get(id) || null;
  }

  /**
   * Get all components
   * @returns {Array} Array of components
   */
  getAllComponents() {
    return Array.from(this.components.values());
  }

  /**
   * Get components by category
   * @param {string} category - Category name
   * @returns {Array} Array of components
   */
  getComponentsByCategory(category) {
    const componentIds = this.categories.get(category) || [];
    return componentIds.map(id => this.components.get(id)).filter(Boolean);
  }

  /**
   * Get all categories
   * @returns {Array} Array of category names
   */
  getCategories() {
    return Array.from(this.categories.keys());
  }

  /**
   * Update a component
   * @param {string} id - Component ID
   * @param {Object} updates - Updates to apply
   */
  updateComponent(id, updates) {
    const component = this.components.get(id);
    if (!component) return;

    Object.assign(component, updates);
    component.metadata.updatedAt = Date.now();
    component.metadata.version = this.incrementVersion(component.metadata.version);

    this.notifyListeners('component:updated', component);
  }

  /**
   * Delete a component
   * @param {string} id - Component ID
   */
  deleteComponent(id) {
    const component = this.components.get(id);
    if (!component) return;

    // Remove from category
    const categoryComponents = this.categories.get(component.category);
    if (categoryComponents) {
      const index = categoryComponents.indexOf(id);
      if (index > -1) {
        categoryComponents.splice(index, 1);
      }
    }

    // Remove from registry
    this.components.delete(id);

    this.notifyListeners('component:deleted', { id });
  }

  /**
   * Register an instance of a global component
   * @param {string} componentId - Global component ID
   * @param {string} instanceId - Instance node ID
   * @param {string} pageId - Page ID where instance is used
   */
  registerInstance(componentId, instanceId, pageId) {
    const component = this.components.get(componentId);
    if (!component) return;

    const instance = {
      id: instanceId,
      pageId,
      registeredAt: Date.now(),
    };

    component.instances.push(instance);
    this.notifyListeners('instance:registered', { componentId, instance });
  }

  /**
   * Unregister an instance of a global component
   * @param {string} componentId - Global component ID
   * @param {string} instanceId - Instance node ID
   */
  unregisterInstance(componentId, instanceId) {
    const component = this.components.get(componentId);
    if (!component) return;

    const index = component.instances.findIndex(inst => inst.id === instanceId);
    if (index > -1) {
      component.instances.splice(index, 1);
    }

    this.notifyListeners('instance:unregistered', { componentId, instanceId });
  }

  /**
   * Get all instances of a component
   * @param {string} componentId - Global component ID
   * @returns {Array} Array of instances
   */
  getInstances(componentId) {
    const component = this.components.get(componentId);
    return component ? component.instances : [];
  }

  /**
   * Detach an instance from global component (convert to local)
   * @param {string} componentId - Global component ID
   * @param {string} instanceId - Instance node ID
   */
  detachInstance(componentId, instanceId) {
    this.unregisterInstance(componentId, instanceId);
    this.notifyListeners('instance:detached', { componentId, instanceId });
  }

  /**
   * Search components by name
   * @param {string} query - Search query
   * @returns {Array} Array of matching components
   */
  searchComponents(query) {
    const lowerQuery = query.toLowerCase();
    return this.getAllComponents().filter(component =>
      component.name.toLowerCase().includes(lowerQuery) ||
      component.category.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Rename a component
   * @param {string} id - Component ID
   * @param {string} newName - New name
   */
  renameComponent(id, newName) {
    this.updateComponent(id, { name: newName });
  }

  /**
   * Change component category
   * @param {string} id - Component ID
   * @param {string} newCategory - New category
   */
  changeCategory(id, newCategory) {
    const component = this.components.get(id);
    if (!component) return;

    // Remove from old category
    const oldCategoryComponents = this.categories.get(component.category);
    if (oldCategoryComponents) {
      const index = oldCategoryComponents.indexOf(id);
      if (index > -1) {
        oldCategoryComponents.splice(index, 1);
      }
    }

    // Add to new category
    if (!this.categories.has(newCategory)) {
      this.categories.set(newCategory, []);
    }
    const newCategoryComponents = this.categories.get(newCategory);
    if (!newCategoryComponents.includes(id)) {
      newCategoryComponents.push(id);
    }

    this.updateComponent(id, { category: newCategory });
  }

  /**
   * Update component thumbnail
   * @param {string} id - Component ID
   * @param {string} thumbnailUrl - Thumbnail URL
   */
  updateThumbnail(id, thumbnailUrl) {
    this.updateComponent(id, { thumbnail: thumbnailUrl });
  }

  /**
   * Duplicate a component
   * @param {string} id - Component ID
   * @returns {string} New component ID
   */
  duplicateComponent(id) {
    const component = this.components.get(id);
    if (!component) return null;

    return this.saveComponent({
      name: `${component.name} (Copy)`,
      type: component.type,
      data: JSON.parse(JSON.stringify(component.data)),
      category: component.category,
      thumbnail: component.thumbnail,
      metadata: {
        ...component.metadata,
        duplicatedFrom: id,
      },
    });
  }

  /**
   * Export component as JSON
   * @param {string} id - Component ID
   * @returns {Object} Exported component data
   */
  exportComponent(id) {
    const component = this.components.get(id);
    if (!component) return null;

    return {
      id: component.id,
      name: component.name,
      type: component.type,
      data: component.data,
      category: component.category,
      thumbnail: component.thumbnail,
      metadata: component.metadata,
      exportedAt: Date.now(),
    };
  }

  /**
   * Import component from JSON
   * @param {Object} data - Imported component data
   * @returns {string} Component ID
   */
  importComponent(data) {
    return this.saveComponent({
      id: data.id,
      name: data.name,
      type: data.type,
      data: data.data,
      category: data.category,
      thumbnail: data.thumbnail,
      metadata: {
        ...data.metadata,
        importedAt: Date.now(),
      },
    });
  }

  /**
   * Generate a unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `global-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Increment version string
   * @param {string} version - Current version
   * @returns {string} New version
   */
  incrementVersion(version) {
    const parts = version.split('.').map(Number);
    parts[2] = (parts[2] || 0) + 1;
    return parts.join('.');
  }

  /**
   * Subscribe to component events
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
   * Notify all listeners of events
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      listener(event, data);
    });
  }

  /**
   * Clear all components
   */
  clear() {
    this.components.clear();
    this.categories.clear();
    this.notifyListeners('components:cleared', {});
  }

  /**
   * Get statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      totalComponents: this.components.size,
      totalCategories: this.categories.size,
      totalInstances: Array.from(this.components.values()).reduce(
        (sum, comp) => sum + comp.instances.length,
        0
      ),
      componentsByType: {
        widget: this.getAllComponents().filter(c => c.type === 'widget').length,
        container: this.getAllComponents().filter(c => c.type === 'container').length,
        section: this.getAllComponents().filter(c => c.type === 'section').length,
      },
    };
  }
}

// Singleton instance
const globalComponentManager = new GlobalComponentManager();

export default globalComponentManager;
export { GlobalComponentManager };
