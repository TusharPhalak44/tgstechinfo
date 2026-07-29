/**
 * Animation Manager
 * Manages animations for widgets with entrance effects, timing, and triggers
 */

import { animationTypes, animationEasing } from '../utils/types';

class AnimationManager {
  constructor() {
    this.animations = new Map();
    this.presets = this.createPresets();
    this.listeners = [];
  }

  /**
   * Create animation presets
   * @returns {Object} Animation presets
   */
  createPresets() {
    return {
      fadeIn: {
        name: 'Fade In',
        keyframes: [
          { opacity: 0, transform: 'translateY(0)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        defaultDuration: 600,
        defaultEasing: 'ease-out',
      },
      slideUp: {
        name: 'Slide Up',
        keyframes: [
          { opacity: 0, transform: 'translateY(30px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        defaultDuration: 600,
        defaultEasing: 'ease-out',
      },
      slideDown: {
        name: 'Slide Down',
        keyframes: [
          { opacity: 0, transform: 'translateY(-30px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        defaultDuration: 600,
        defaultEasing: 'ease-out',
      },
      slideLeft: {
        name: 'Slide Left',
        keyframes: [
          { opacity: 0, transform: 'translateX(30px)' },
          { opacity: 1, transform: 'translateX(0)' },
        ],
        defaultDuration: 600,
        defaultEasing: 'ease-out',
      },
      slideRight: {
        name: 'Slide Right',
        keyframes: [
          { opacity: 0, transform: 'translateX(-30px)' },
          { opacity: 1, transform: 'translateX(0)' },
        ],
        defaultDuration: 600,
        defaultEasing: 'ease-out',
      },
      zoomIn: {
        name: 'Zoom In',
        keyframes: [
          { opacity: 0, transform: 'scale(0.8)' },
          { opacity: 1, transform: 'scale(1)' },
        ],
        defaultDuration: 600,
        defaultEasing: 'ease-out',
      },
      zoomOut: {
        name: 'Zoom Out',
        keyframes: [
          { opacity: 0, transform: 'scale(1.2)' },
          { opacity: 1, transform: 'scale(1)' },
        ],
        defaultDuration: 600,
        defaultEasing: 'ease-out',
      },
      bounce: {
        name: 'Bounce',
        keyframes: [
          { transform: 'translateY(0)' },
          { transform: 'translateY(-20px)' },
          { transform: 'translateY(0)' },
          { transform: 'translateY(-10px)' },
          { transform: 'translateY(0)' },
        ],
        defaultDuration: 800,
        defaultEasing: 'ease-in-out',
      },
      rotate: {
        name: 'Rotate',
        keyframes: [
          { opacity: 0, transform: 'rotate(-180deg)' },
          { opacity: 1, transform: 'rotate(0)' },
        ],
        defaultDuration: 800,
        defaultEasing: 'ease-out',
      },
      flip: {
        name: 'Flip',
        keyframes: [
          { transform: 'perspective(400px) rotateY(90deg)' },
          { transform: 'perspective(400px) rotateY(0)' },
        ],
        defaultDuration: 800,
        defaultEasing: 'ease-out',
      },
      pulse: {
        name: 'Pulse',
        keyframes: [
          { transform: 'scale(1)' },
          { transform: 'scale(1.05)' },
          { transform: 'scale(1)' },
        ],
        defaultDuration: 1000,
        defaultEasing: 'ease-in-out',
      },
    };
  }

  /**
   * Get animation preset
   * @param {string} type - Animation type
   * @returns {Object|null} Animation preset or null
   */
  getPreset(type) {
    return this.presets[type] || null;
  }

  /**
   * Get all presets
   * @returns {Object} All animation presets
   */
  getAllPresets() {
    return this.presets;
  }

  /**
   * Register an animation for a node
   * @param {string} nodeId - Node ID
   * @param {Object} animation - Animation configuration
   */
  registerAnimation(nodeId, animation) {
    const config = {
      type: animation.type || 'none',
      duration: animation.duration || 600,
      delay: animation.delay || 0,
      easing: animation.easing || 'ease-out',
      iteration: animation.iteration || 1,
      trigger: animation.trigger || 'onLoad',
      scrollThreshold: animation.scrollThreshold || 0.2,
      hover: animation.hover || false,
      ...animation,
    };

    this.animations.set(nodeId, config);
    this.notifyListeners('animation:registered', { nodeId, config });
  }

  /**
   * Get animation for a node
   * @param {string} nodeId - Node ID
   * @returns {Object|null} Animation config or null
   */
  getAnimation(nodeId) {
    return this.animations.get(nodeId) || null;
  }

  /**
   * Update animation for a node
   * @param {string} nodeId - Node ID
   * @param {Object} updates - Animation updates
   */
  updateAnimation(nodeId, updates) {
    const current = this.animations.get(nodeId);
    if (current) {
      const updated = { ...current, ...updates };
      this.animations.set(nodeId, updated);
      this.notifyListeners('animation:updated', { nodeId, config: updated });
    }
  }

  /**
   * Remove animation from a node
   * @param {string} nodeId - Node ID
   */
  removeAnimation(nodeId) {
    this.animations.delete(nodeId);
    this.notifyListeners('animation:removed', { nodeId });
  }

  /**
   * Generate CSS for an animation
   * @param {string} nodeId - Node ID
   * @returns {string} CSS string
   */
  generateCSS(nodeId) {
    const config = this.animations.get(nodeId);
    if (!config || config.type === 'none') return '';

    const preset = this.getPreset(config.type);
    if (!preset) return '';

    const keyframesName = `animation-${nodeId}-${config.type}`;
    const keyframesCSS = this.generateKeyframesCSS(keyframesName, preset.keyframes);

    const animationCSS = `
  animation-name: ${keyframesName};
  animation-duration: ${config.duration}ms;
  animation-delay: ${config.delay}ms;
  animation-timing-function: ${config.easing};
  animation-iteration-count: ${config.iteration === 'infinite' ? 'infinite' : config.iteration};
  animation-fill-mode: both;
`;

    return keyframesCSS + animationCSS;
  }

  /**
   * Generate keyframes CSS
   * @param {string} name - Animation name
   * @param {Array} keyframes - Keyframes array
   * @returns {string} CSS string
   */
  generateKeyframesCSS(name, keyframes) {
    const percentageStep = 100 / (keyframes.length - 1);
    let css = `@keyframes ${name} {\n`;

    keyframes.forEach((frame, index) => {
      const percentage = index === keyframes.length - 1 ? 100 : index * percentageStep;
      const properties = Object.entries(frame)
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ');
      css += `  ${percentage}% { ${properties}; }\n`;
    });

    css += '}\n';
    return css;
  }

  /**
   * Generate animation trigger JavaScript
   * @param {string} nodeId - Node ID
   * @returns {string} JavaScript string
   */
  generateTriggerJS(nodeId) {
    const config = this.animations.get(nodeId);
    if (!config || config.trigger === 'onLoad') return '';

    if (config.trigger === 'onScroll') {
      return `
const element = document.querySelector('[data-node-id="${nodeId}"]');
if (element) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        element.style.animationPlayState = 'running';
        observer.unobserve(element);
      }
    });
  }, { threshold: ${config.scrollThreshold} });
  observer.observe(element);
  element.style.animationPlayState = 'paused';
}`;
    }

    if (config.trigger === 'onHover' && config.hover) {
      return `
const element = document.querySelector('[data-node-id="${nodeId}"]');
if (element) {
  element.addEventListener('mouseenter', () => {
    element.style.animationPlayState = 'running';
  });
  element.addEventListener('mouseleave', () => {
    element.style.animationPlayState = 'paused';
  });
  element.style.animationPlayState = 'paused';
}`;
    }

    return '';
  }

  /**
   * Preview animation in builder
   * @param {string} nodeId - Node ID
   * @param {HTMLElement} element - DOM element
   */
  previewAnimation(nodeId, element) {
    const config = this.animations.get(nodeId);
    if (!config || config.type === 'none') return;

    const preset = this.getPreset(config.type);
    if (!preset) return;

    // Apply animation styles
    element.style.animation = `${config.type} ${config.duration}ms ${config.easing} ${config.delay}ms ${config.iteration === 'infinite' ? 'infinite' : config.iteration} both`;

    // Reset after animation completes
    setTimeout(() => {
      element.style.animation = '';
    }, config.duration + config.delay + 100);
  }

  /**
   * Get animation statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      totalAnimations: this.animations.size,
      totalPresets: Object.keys(this.presets).length,
      animationsByType: this.getAnimationsByType(),
    };
  }

  /**
   * Get animations grouped by type
   * @returns {Object} Animations by type
   */
  getAnimationsByType() {
    const byType = {};
    this.animations.forEach((config) => {
      if (!byType[config.type]) {
        byType[config.type] = 0;
      }
      byType[config.type]++;
    });
    return byType;
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
   * Clear all animations
   */
  clear() {
    this.animations.clear();
    this.notifyListeners('animations:cleared', {});
  }
}

// Singleton instance
const animationManager = new AnimationManager();

export default animationManager;
export { AnimationManager };
