/**
 * Widget Registry System
 * Central registry for all builder widgets
 * Allows dynamic widget registration and retrieval
 */

class WidgetRegistry {
  constructor() {
    this.widgets = new Map();
    this.categories = new Map();
    this.validators = new Map();
    this.serializers = new Map();
    this.deserializers = new Map();
    this.previews = new Map();
  }

  /**
   * Register a widget with complete registration structure
   * @param {Object} registration - Widget registration object
   * @param {string} registration.type - Widget type (required)
   * @param {string} registration.name - Widget display name (required)
   * @param {string} registration.icon - Widget icon (emoji or component)
   * @param {string} registration.category - Widget category
   * @param {Object} registration.defaultSettings - Default settings
   * @param {React.Component} registration.component - Builder component
   * @param {React.Component} registration.renderer - Frontend renderer component
   * @param {React.Component} registration.inspector - Inspector component
   * @param {React.Component} registration.toolbar - Toolbar component
   * @param {Function} registration.validator - Validation function
   * @param {Function} registration.serializer - Serialization function
   * @param {Function} registration.deserializer - Deserialization function
   * @param {React.Component} registration.preview - Preview component
   * @param {string} registration.version - Widget version
   * @param {Object} registration.metadata - Additional metadata
   */
  register(registration) {
    try {
      const { 
        type, 
        name, 
        icon = '📦',
        category = 'general',
        defaultSettings = {},
        defaultStyles = {},
        metadata = {} 
      } = registration;
      
      if (!type) {
        console.error('Widget registration requires a type', registration);
        return false;
      }
      
      if (!name) {
        console.error('Widget registration requires a name', registration);
        return false;
      }
      
      if (!registration.component) {
        console.error(`Widget registration for "${type}" missing component`, registration);
        return false;
      }
      
      if (this.widgets.has(type)) {
        console.warn(`Widget type "${type}" is already registered. Overwriting.`);
      }
      
      this.widgets.set(type, {
        ...registration,
        metadata: {
          label: name,
          icon,
          category,
          description: '',
          version: '1.0.0',
          ...metadata,
        },
        defaultSettings,
        defaultStyles,
      });
      
      // Register additional components separately
      if (registration.validator) this.validators.set(type, registration.validator);
      if (registration.serializer) this.serializers.set(type, registration.serializer);
      if (registration.deserializer) this.deserializers.set(type, registration.deserializer);
      if (registration.preview) this.previews.set(type, registration.preview);
      
      // Register category if provided
      if (category) {
        if (!this.categories.has(category)) {
          this.categories.set(category, []);
        }
        const categoryWidgets = this.categories.get(category);
        if (!categoryWidgets.includes(type)) {
          categoryWidgets.push(type);
        }
      }
      
      console.log(`Registered widget: ${type} v${registration.version || '1.0.0'}`);
      return true;
    } catch (error) {
      console.error('Failed to register widget:', error, registration);
      return false;
    }
  }

  /**
   * Get a widget by type with error handling
   * @param {string} type - Widget type
   * @returns {Object|null} Widget registration or null
   */
  get(type) {
    if (!type) {
      console.warn('WidgetRegistry.get called with undefined type');
      return null;
    }
    
    const widget = this.widgets.get(type);
    
    if (!widget) {
      console.warn(`Widget type "${type}" not found in registry`);
      return null;
    }
    
    return widget;
  }

  /**
   * Check if a widget type is registered
   * @param {string} type - Widget type
   * @returns {boolean}
   */
  has(type) {
    return this.widgets.has(type);
  }

  /**
   * Get all registered widgets
   * @returns {Array} Array of widget registrations
   */
  getAll() {
    return Array.from(this.widgets.values());
  }

  /**
   * Get widgets by category
   * @param {string} category - Category name
   * @returns {Array} Array of widget registrations
   */
  getByCategory(category) {
    const widgetTypes = this.categories.get(category) || [];
    return widgetTypes.map(type => this.widgets.get(type)).filter(Boolean);
  }

  /**
   * Get all categories
   * @returns {Array} Array of category names
   */
  getCategories() {
    return Array.from(this.categories.keys());
  }

  /**
   * Unregister a widget
   * @param {string} type - Widget type
   */
  unregister(type) {
    const widget = this.widgets.get(type);
    if (widget) {
      // Remove from category
      if (widget.metadata?.category) {
        const categoryWidgets = this.categories.get(widget.metadata.category);
        if (categoryWidgets) {
          const index = categoryWidgets.indexOf(type);
          if (index > -1) {
            categoryWidgets.splice(index, 1);
          }
        }
      }
      // Remove from registry
      this.widgets.delete(type);
      this.validators.delete(type);
      this.serializers.delete(type);
      this.deserializers.delete(type);
      this.previews.delete(type);
    }
  }

  /**
   * Clear all registered widgets
   */
  clear() {
    this.widgets.clear();
    this.categories.clear();
    this.validators.clear();
    this.serializers.clear();
    this.deserializers.clear();
    this.previews.clear();
    console.log('Widget registry cleared');
  }

  /**
   * Get widget metadata
   * @param {string} type - Widget type
   * @returns {Object|null} Widget metadata or null
   */
  getMetadata(type) {
    const widget = this.widgets.get(type);
    return widget ? widget.metadata : null;
  }

  /**
   * Get widget component
   * @param {string} type - Widget type
   * @returns {React.Component|null} Widget component or null
   */
  getComponent(type) {
    const widget = this.widgets.get(type);
    return widget ? widget.component : null;
  }

  /**
   * Get widget renderer
   * @param {string} type - Widget type
   * @returns {React.Component|null} Widget renderer or null
   */
  getRenderer(type) {
    const widget = this.widgets.get(type);
    return widget ? widget.renderer : null;
  }

  /**
   * Get widget inspector
   * @param {string} type - Widget type
   * @returns {React.Component|null} Widget inspector or null
   */
  getInspector(type) {
    const widget = this.widgets.get(type);
    return widget ? widget.inspector : null;
  }

  /**
   * Generate HTML for a widget node
   * @param {Object} node - Builder node
   * @returns {string} HTML string
   */
  toHtml(node) {
    const widget = this.widgets.get(node.type);
    if (widget && typeof widget.toHtml === 'function') {
      return widget.toHtml(node);
    }
    return '';
  }

  /**
   * Get default props for a widget type
   * @param {string} type - Widget type
   * @returns {Object} Default props
   */
  getDefaultProps(type) {
    const widget = this.widgets.get(type);
    return widget ? (widget.defaultProps || {}) : {};
  }

  /**
   * Get default styles for a widget type
   * @param {string} type - Widget type
   * @returns {Object} Default styles
   */
  getDefaultStyles(type) {
    const widget = this.widgets.get(type);
    return widget ? (widget.defaultStyles || {}) : {};
  }

  /**
   * Get widget toolbar component
   * @param {string} type - Widget type
   * @returns {React.Component|null} Widget toolbar or null
   */
  getToolbar(type) {
    const widget = this.widgets.get(type);
    return widget ? widget.toolbar : null;
  }

  /**
   * Get widget validator function
   * @param {string} type - Widget type
   * @returns {Function|null} Validator function or null
   */
  getValidator(type) {
    const widget = this.widgets.get(type);
    return widget ? widget.validator : null;
  }

  /**
   * Get widget serializer function
   * @param {string} type - Widget type
   * @returns {Function|null} Serializer function or null
   */
  getSerializer(type) {
    const widget = this.widgets.get(type);
    return widget ? widget.serializer : null;
  }

  /**
   * Get widget deserializer function
   * @param {string} type - Widget type
   * @returns {Function|null} Deserializer function or null
   */
  getDeserializer(type) {
    const widget = this.widgets.get(type);
    return widget ? widget.deserializer : null;
  }

  /**
   * Get widget preview component
   * @param {string} type - Widget type
   * @returns {React.Component|null} Preview component or null
   */
  getPreview(type) {
    const widget = this.widgets.get(type);
    return widget ? widget.preview : null;
  }

  /**
   * Validate widget node
   * @param {Object} node - Builder node
   * @returns {Object} Validation result { valid: boolean, errors: string[] }
   */
  validate(node) {
    const widget = this.widgets.get(node.type);
    if (!widget) {
      return { valid: false, errors: [`Widget type "${node.type}" is not registered`] };
    }
    
    if (typeof widget.validator === 'function') {
      try {
        return widget.validator(node);
      } catch (error) {
        return { valid: false, errors: [`Validation error: ${error.message}`] };
      }
    }
    
    return { valid: true, errors: [] };
  }

  /**
   * Serialize widget node
   * @param {Object} node - Builder node
   * @returns {Object} Serialized data
   */
  serialize(node) {
    const widget = this.widgets.get(node.type);
    if (!widget) {
      return node;
    }
    
    if (typeof widget.serializer === 'function') {
      try {
        return widget.serializer(node);
      } catch (error) {
        console.error('Serialization error:', error);
        return node;
      }
    }
    
    return node;
  }

  /**
   * Deserialize widget node
   * @param {Object} data - Serialized data
   * @returns {Object} Builder node
   */
  deserialize(data) {
    const widget = this.widgets.get(data.type);
    if (!widget) {
      return data;
    }
    
    if (typeof widget.deserializer === 'function') {
      try {
        return widget.deserializer(data);
      } catch (error) {
        console.error('Deserialization error:', error);
        return data;
      }
    }
    
    return data;
  }
  /**
   * Get widget version
   * @param {string} type - Widget type
   * @returns {string|null} Widget version or null
   */
  getVersion(type) {
    const widget = this.widgets.get(type);
    return widget?.metadata?.version || widget?.version || null;
  }

  /**
   * Check widget compatibility
   * @param {string} type - Widget type
   * @param {string} minVersion - Minimum required version
   * @returns {boolean}
   */
  isCompatible(type, minVersion) {
    const version = this.getVersion(type);
    if (!version) return false;
    
    const currentParts = version.split('.').map(Number);
    const minParts = minVersion.split('.').map(Number);
    
    for (let i = 0; i < Math.max(currentParts.length, minParts.length); i++) {
      const current = currentParts[i] || 0;
      const min = minParts[i] || 0;
      
      if (current > min) return true;
      if (current < min) return false;
    }
    
    return true;
  }

  /**
   * Get registry statistics
   * @returns {Object} Registry statistics
   */
  getStats() {
    return {
      totalWidgets: this.widgets.size,
      totalCategories: this.categories.size,
      widgetsWithValidators: this.validators.size,
      widgetsWithSerializers: this.serializers.size,
      widgetsWithDeserializers: this.deserializers.size,
      widgetsWithPreviews: this.previews.size,
    };
  }
}

// Singleton instance
const widgetRegistry = new WidgetRegistry();

export default widgetRegistry;
export { WidgetRegistry };
