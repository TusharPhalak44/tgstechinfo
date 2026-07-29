/**
 * Interaction Manager
 * Manages widget interactions (click, hover, scroll, viewport)
 * Supports actions like open popup, scroll to, play video, download, navigate
 */

class InteractionManager {
  constructor() {
    this.interactions = new Map();
    this.listeners = [];
  }

  /**
   * Interaction types
   */
  static get InteractionTypes() {
    return {
      click: 'click',
      hover: 'hover',
      scroll: 'scroll',
      viewport: 'viewport',
    };
  }

  /**
   * Action types
   */
  static get ActionTypes() {
    return {
      openPopup: 'openPopup',
      scrollTo: 'scrollTo',
      playVideo: 'playVideo',
      downloadPDF: 'downloadPDF',
      navigate: 'navigate',
      customAction: 'customAction',
      toggleClass: 'toggleClass',
      showElement: 'showElement',
      hideElement: 'hideElement',
      copyToClipboard: 'copyToClipboard',
    };
  }

  /**
   * Add an interaction to a node
   * @param {string} nodeId - Node ID
   * @param {Object} interaction - Interaction configuration
   * @param {string} interaction.type - Interaction type (click, hover, scroll, viewport)
   * @param {string} interaction.action - Action type
   * @param {Object} interaction.config - Action configuration
   * @param {boolean} interaction.enabled - Interaction enabled state
   * @returns {string} Interaction ID
   */
  addInteraction(nodeId, interaction) {
    if (!this.interactions.has(nodeId)) {
      this.interactions.set(nodeId, []);
    }

    const nodeInteractions = this.interactions.get(nodeId);
    const interactionId = this.generateId();
    
    const newInteraction = {
      id: interactionId,
      type: interaction.type || 'click',
      action: interaction.action || 'navigate',
      config: interaction.config || {},
      enabled: interaction.enabled !== undefined ? interaction.enabled : true,
      priority: interaction.priority || 0,
      createdAt: Date.now(),
    };

    nodeInteractions.push(newInteraction);
    this.notifyListeners('interaction:added', { nodeId, interaction: newInteraction });
    return interactionId;
  }

  /**
   * Get interactions for a node
   * @param {string} nodeId - Node ID
   * @returns {Array} Array of interactions
   */
  getInteractions(nodeId) {
    return this.interactions.get(nodeId) || [];
  }

  /**
   * Get interactions by type
   * @param {string} nodeId - Node ID
   * @param {string} type - Interaction type
   * @returns {Array} Array of interactions
   */
  getInteractionsByType(nodeId, type) {
    const nodeInteractions = this.interactions.get(nodeId) || [];
    return nodeInteractions.filter(interaction => interaction.type === type);
  }

  /**
   * Update an interaction
   * @param {string} nodeId - Node ID
   * @param {string} interactionId - Interaction ID
   * @param {Object} updates - Updates to apply
   */
  updateInteraction(nodeId, interactionId, updates) {
    const nodeInteractions = this.interactions.get(nodeId);
    if (!nodeInteractions) return;

    const interactionIndex = nodeInteractions.findIndex(i => i.id === interactionId);
    if (interactionIndex > -1) {
      nodeInteractions[interactionIndex] = { ...nodeInteractions[interactionIndex], ...updates };
      this.notifyListeners('interaction:updated', { nodeId, interaction: nodeInteractions[interactionIndex] });
    }
  }

  /**
   * Remove an interaction
   * @param {string} nodeId - Node ID
   * @param {string} interactionId - Interaction ID
   */
  removeInteraction(nodeId, interactionId) {
    const nodeInteractions = this.interactions.get(nodeId);
    if (!nodeInteractions) return;

    const index = nodeInteractions.findIndex(i => i.id === interactionId);
    if (index > -1) {
      nodeInteractions.splice(index, 1);
      this.notifyListeners('interaction:removed', { nodeId, interactionId });
    }
  }

  /**
   * Clear all interactions for a node
   * @param {string} nodeId - Node ID
   */
  clearInteractions(nodeId) {
    this.interactions.delete(nodeId);
    this.notifyListeners('interactions:cleared', { nodeId });
  }

  /**
   * Enable/disable an interaction
   * @param {string} nodeId - Node ID
   * @param {string} interactionId - Interaction ID
   * @param {boolean} enabled - Enabled state
   */
  setInteractionEnabled(nodeId, interactionId, enabled) {
    this.updateInteraction(nodeId, interactionId, { enabled });
  }

  /**
   * Generate JavaScript for an interaction
   * @param {string} nodeId - Node ID
   * @param {string} interactionId - Interaction ID
   * @returns {string} JavaScript code
   */
  generateJS(nodeId, interactionId) {
    const nodeInteractions = this.interactions.get(nodeId);
    if (!nodeInteractions) return '';

    const interaction = nodeInteractions.find(i => i.id === interactionId);
    if (!interaction || !interaction.enabled) return '';

    return this.generateActionJS(interaction);
  }

  /**
   * Generate JavaScript for an action
   * @param {Object} interaction - Interaction object
   * @returns {string} JavaScript code
   */
  generateActionJS(interaction) {
    const { action, config } = interaction;

    switch (action) {
      case 'navigate':
        return `window.location.href = '${config.url || '#'}';`;
      
      case 'scrollTo':
        return `document.querySelector('${config.selector || '#'}')?.scrollIntoView({ behavior: 'smooth' });`;
      
      case 'openPopup':
        return `
const popup = document.getElementById('${config.popupId || ''}');
if (popup) {
  popup.style.display = 'flex';
}`;
      
      case 'playVideo':
        return `
const video = document.querySelector('${config.videoSelector || ''}');
if (video) {
  video.play();
}`;
      
      case 'downloadPDF':
        return `
const link = document.createElement('a');
link.href = '${config.url || ''}';
link.download = '${config.filename || 'document.pdf'}';
link.click();`;
      
      case 'toggleClass':
        return `
const element = document.querySelector('${config.selector || ''}');
if (element) {
  element.classList.toggle('${config.className || ''}');
}`;
      
      case 'showElement':
        return `
const element = document.querySelector('${config.selector || ''}');
if (element) {
  element.style.display = '${config.display || 'block'}';
}`;
      
      case 'hideElement':
        return `
const element = document.querySelector('${config.selector || ''}');
if (element) {
  element.style.display = 'none';
}`;
      
      case 'copyToClipboard':
        return `
navigator.clipboard.writeText('${config.text || ''}').then(() => {
  alert('Copied to clipboard!');
});`;
      
      case 'customAction':
        return config.code || '';
      
      default:
        return '';
    }
  }

  /**
   * Generate event listener JavaScript for a node
   * @param {string} nodeId - Node ID
   * @returns {string} JavaScript code
   */
  generateEventListeners(nodeId) {
    const nodeInteractions = this.interactions.get(nodeId);
    if (!nodeInteractions || nodeInteractions.length === 0) return '';

    const interactionsByType = {
      click: [],
      hover: [],
      scroll: [],
      viewport: [],
    };

    nodeInteractions.forEach(interaction => {
      if (interaction.enabled && interactionsByType[interaction.type]) {
        interactionsByType[interaction.type].push(interaction);
      }
    });

    let js = '';

    // Click interactions
    if (interactionsByType.click.length > 0) {
      js += `
const element = document.querySelector('[data-node-id="${nodeId}"]');
if (element) {
  element.addEventListener('click', (e) => {
    ${interactionsByType.click.map(i => this.generateActionJS(i)).join('\n    ')}
  });
}`;
    }

    // Hover interactions
    if (interactionsByType.hover.length > 0) {
      js += `
const element = document.querySelector('[data-node-id="${nodeId}"]');
if (element) {
  element.addEventListener('mouseenter', () => {
    ${interactionsByType.hover.map(i => this.generateActionJS(i)).join('\n    ')}
  });
}`;
    }

    // Scroll interactions
    if (interactionsByType.scroll.length > 0) {
      js += `
window.addEventListener('scroll', () => {
  const element = document.querySelector('[data-node-id="${nodeId}"]');
  if (element) {
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      ${interactionsByType.scroll.map(i => this.generateActionJS(i)).join('\n      ')}
    }
  }
});`;
    }

    // Viewport interactions
    if (interactionsByType.viewport.length > 0) {
      js += `
const element = document.querySelector('[data-node-id="${nodeId}"]');
if (element) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        ${interactionsByType.viewport.map(i => this.generateActionJS(i)).join('\n        ')}
      }
    });
  }, { threshold: 0.5 });
  observer.observe(element);
}`;
    }

    return js;
  }

  /**
   * Generate a unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
   * Clear all interactions
   */
  clear() {
    this.interactions.clear();
    this.notifyListeners('interactions:cleared', { all: true });
  }

  /**
   * Get statistics
   * @returns {Object} Statistics
   */
  getStats() {
    let totalInteractions = 0;
    const interactionsByType = {};
    const interactionsByAction = {};

    this.interactions.forEach((nodeInteractions) => {
      totalInteractions += nodeInteractions.length;
      nodeInteractions.forEach(interaction => {
        if (!interactionsByType[interaction.type]) {
          interactionsByType[interaction.type] = 0;
        }
        interactionsByType[interaction.type]++;

        if (!interactionsByAction[interaction.action]) {
          interactionsByAction[interaction.action] = 0;
        }
        interactionsByAction[interaction.action]++;
      });
    });

    return {
      totalInteractions,
      totalNodes: this.interactions.size,
      interactionsByType,
      interactionsByAction,
    };
  }
}

// Singleton instance
const interactionManager = new InteractionManager();

export default interactionManager;
export { InteractionManager };
