/**
 * Builder Events System
 * Pub/sub event system for builder communication
 * Used for node selection, updates, deletions, and future features
 */

import { BuilderEventType } from '../utils/types';

class BuilderEvents {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event type
   * @param {string} eventType - Event type from BuilderEventType
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    this.listeners.get(eventType).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit an event
   * @param {string} eventType - Event type from BuilderEventType
   * @param {any} payload - Event payload
   */
  emit(eventType, payload = null) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const event = {
        type: eventType,
        payload,
        timestamp: Date.now(),
      };
      
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Unsubscribe all listeners for an event type
   * @param {string} eventType - Event type from BuilderEventType
   */
  unsubscribeAll(eventType) {
    this.listeners.delete(eventType);
  }

  /**
   * Clear all event listeners
   */
  clear() {
    this.listeners.clear();
  }

  /**
   * Get listener count for an event type
   * @param {string} eventType - Event type from BuilderEventType
   * @returns {number} Number of listeners
   */
  getListenerCount(eventType) {
    const callbacks = this.listeners.get(eventType);
    return callbacks ? callbacks.length : 0;
  }
}

// Singleton instance
const builderEvents = new BuilderEvents();

export default builderEvents;
export { BuilderEvents };
