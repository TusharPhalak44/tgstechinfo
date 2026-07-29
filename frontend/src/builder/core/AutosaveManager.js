/**
 * Autosave Manager
 * Handles automatic saving and draft recovery
 */

class AutosaveManager {
  constructor() {
    this.autosaveInterval = null;
    this.autosaveDelay = 30000; // 30 seconds
    this.isAutosaving = false;
    this.lastAutosave = null;
    this.drafts = new Map();
    this.listeners = [];
    this.storageKey = 'builder-autosave-drafts';
  }

  /**
   * Start autosave
   * @param {Function} saveFunction - Function to call for autosave
   * @param {number} delay - Autosave delay in milliseconds
   */
  startAutosave(saveFunction, delay = 30000) {
    this.stopAutosave();
    this.autosaveDelay = delay;
    
    this.autosaveInterval = setInterval(async () => {
      if (!this.isAutosaving) {
        this.isAutosaving = true;
        try {
          await this.performAutosave(saveFunction);
        } catch (error) {
          console.error('Autosave failed:', error);
          this.notifyListeners('autosave:error', { error });
        } finally {
          this.isAutosaving = false;
        }
      }
    }, this.autosaveDelay);

    this.notifyListeners('autosave:started', { delay });
  }

  /**
   * Stop autosave
   */
  stopAutosave() {
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
      this.autosaveInterval = null;
      this.notifyListeners('autosave:stopped', {});
    }
  }

  /**
   * Perform autosave
   * @param {Function} saveFunction - Save function
   */
  async performAutosave(saveFunction) {
    const timestamp = Date.now();
    
    if (typeof saveFunction === 'function') {
      await saveFunction();
    }
    
    this.lastAutosave = timestamp;
    this.notifyListeners('autosave:completed', { timestamp });
  }

  /**
   * Save a draft
   * @param {string} pageId - Page ID
   * @param {Object} data - Page data
   */
  saveDraft(pageId, data) {
    const draft = {
      pageId,
      data,
      timestamp: Date.now(),
      version: this.generateVersion(),
    };

    this.drafts.set(pageId, draft);
    this.persistDrafts();
    this.notifyListeners('draft:saved', { pageId, draft });
  }

  /**
   * Get a draft
   * @param {string} pageId - Page ID
   * @returns {Object|null} Draft or null
   */
  getDraft(pageId) {
    return this.drafts.get(pageId) || null;
  }

  /**
   * Get all drafts
   * @returns {Array} Array of drafts
   */
  getAllDrafts() {
    return Array.from(this.drafts.values());
  }

  /**
   * Delete a draft
   * @param {string} pageId - Page ID
   */
  deleteDraft(pageId) {
    this.drafts.delete(pageId);
    this.persistDrafts();
    this.notifyListeners('draft:deleted', { pageId });
  }

  /**
   * Clear all drafts
   */
  clearAllDrafts() {
    this.drafts.clear();
    this.persistDrafts();
    this.notifyListeners('drafts:cleared', {});
  }

  /**
   * Recover a draft
   * @param {string} pageId - Page ID
   * @returns {Object|null} Draft data or null
   */
  recoverDraft(pageId) {
    const draft = this.drafts.get(pageId);
    if (draft) {
      this.notifyListeners('draft:recovered', { pageId, draft });
      return draft.data;
    }
    return null;
  }

  /**
   * Persist drafts to localStorage
   */
  persistDrafts() {
    try {
      const draftsData = Array.from(this.drafts.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(draftsData));
    } catch (error) {
      console.error('Failed to persist drafts:', error);
    }
  }

  /**
   * Load drafts from localStorage
   */
  loadDrafts() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const draftsData = JSON.parse(data);
        this.drafts = new Map(draftsData);
      }
    } catch (error) {
      console.error('Failed to load drafts:', error);
    }
  }

  /**
   * Check if there's a recent draft
   * @param {string} pageId - Page ID
   * @param {number} maxAge - Maximum age in milliseconds
   * @returns {boolean} Has recent draft
   */
  hasRecentDraft(pageId, maxAge = 3600000) {
    const draft = this.drafts.get(pageId);
    if (!draft) return false;
    
    const age = Date.now() - draft.timestamp;
    return age < maxAge;
  }

  /**
   * Get autosave status
   * @returns {Object} Autosave status
   */
  getStatus() {
    return {
      isAutosaving: this.isAutosaving,
      lastAutosave: this.lastAutosave,
      autosaveDelay: this.autosaveDelay,
      totalDrafts: this.drafts.size,
      nextAutosaveIn: this.lastAutosave 
        ? Math.max(0, this.autosaveDelay - (Date.now() - this.lastAutosave))
        : this.autosaveDelay,
    };
  }

  /**
   * Generate a version string
   * @returns {string} Version string
   */
  generateVersion() {
    return Date.now().toString(36);
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
   * Reset the manager
   */
  reset() {
    this.stopAutosave();
    this.isAutosaving = false;
    this.lastAutosave = null;
    this.clearAllDrafts();
  }
}

// Singleton instance
const autosaveManager = new AutosaveManager();

// Load drafts on initialization
autosaveManager.loadDrafts();

export default autosaveManager;
export { AutosaveManager };
