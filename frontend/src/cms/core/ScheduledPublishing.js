/**
 * Scheduled Publishing Manager
 * Supports immediate, schedule, recurring publishing with timezone and expiration
 */

class ScheduledPublishingManager {
  constructor() {
    this.schedules = new Map();
    this.listeners = [];
    this.checkInterval = null;
    
    this.startScheduleChecker();
  }

  /**
   * Schedule a page for publishing
   * @param {Object} schedule - Schedule configuration
   * @returns {string} Schedule ID
   */
  schedulePublish(schedule) {
    const id = schedule.id || this.generateId();
    
    const newSchedule = {
      id,
      pageId: schedule.pageId,
      type: schedule.type || 'once', // once, recurring
      scheduledAt: schedule.scheduledAt,
      timezone: schedule.timezone || 'UTC',
      status: 'scheduled',
      createdBy: schedule.createdBy || 'current-user',
      createdAt: Date.now(),
      recurrence: schedule.recurrence || null, // daily, weekly, monthly
      recurrenceEnd: schedule.recurrenceEnd || null,
      expiration: schedule.expiration || null,
      autoArchive: schedule.autoArchive || false,
      metadata: schedule.metadata || {},
    };

    this.schedules.set(id, newSchedule);
    this.notifyListeners('schedule:created', newSchedule);
    return id;
  }

  /**
   * Publish immediately
   * @param {string} pageId - Page ID
   * @param {Object} context - Publish context
   * @returns {Object} Publish result
   */
  publishImmediately(pageId, context = {}) {
    const result = {
      pageId,
      publishedAt: Date.now(),
      publishedBy: context.publishedBy || 'current-user',
      type: 'immediate',
    };

    this.notifyListeners('page:published', result);
    return result;
  }

  /**
   * Get schedule
   * @param {string} id - Schedule ID
   * @returns {Object|null} Schedule or null
   */
  getSchedule(id) {
    return this.schedules.get(id) || null;
  }

  /**
   * Get schedules for a page
   * @param {string} pageId - Page ID
   * @returns {Array} Array of schedules
   */
  getSchedulesForPage(pageId) {
    return Array.from(this.schedules.values()).filter(
      schedule => schedule.pageId === pageId
    );
  }

  /**
   * Get pending schedules
   * @returns {Array} Array of pending schedules
   */
  getPendingSchedules() {
    const now = Date.now();
    return Array.from(this.schedules.values()).filter(
      schedule => 
        schedule.status === 'scheduled' &&
        new Date(schedule.scheduledAt).getTime() > now
    );
  }

  /**
   * Get overdue schedules
   * @returns {Array} Array of overdue schedules
   */
  getOverdueSchedules() {
    const now = Date.now();
    return Array.from(this.schedules.values()).filter(
      schedule => 
        schedule.status === 'scheduled' &&
        new Date(schedule.scheduledAt).getTime() < now
    );
  }

  /**
   * Update schedule
   * @param {string} id - Schedule ID
   * @param {Object} updates - Updates to apply
   */
  updateSchedule(id, updates) {
    const schedule = this.schedules.get(id);
    if (!schedule) return;

    Object.assign(schedule, updates);
    this.schedules.set(id, schedule);
    this.notifyListeners('schedule:updated', schedule);
  }

  /**
   * Cancel schedule
   * @param {string} id - Schedule ID
   */
  cancelSchedule(id) {
    const schedule = this.schedules.get(id);
    if (!schedule) return;

    schedule.status = 'cancelled';
    schedule.cancelledAt = Date.now();
    this.schedules.set(id, schedule);
    this.notifyListeners('schedule:cancelled', schedule);
  }

  /**
   * Delete schedule
   * @param {string} id - Schedule ID
   */
  deleteSchedule(id) {
    this.schedules.delete(id);
    this.notifyListeners('schedule:deleted', { id });
  }

  /**
   * Process scheduled publishing
   */
  processScheduledPublishing() {
    const now = Date.now();
    const overdue = this.getOverdueSchedules();

    overdue.forEach(schedule => {
      this.executeSchedule(schedule);
    });
  }

  /**
   * Execute a schedule
   * @param {Object} schedule - Schedule to execute
   */
  executeSchedule(schedule) {
    if (schedule.status !== 'scheduled') return;

    // Publish the page
    const result = {
      pageId: schedule.pageId,
      publishedAt: Date.now(),
      type: 'scheduled',
      scheduleId: schedule.id,
    };

    this.notifyListeners('page:published', result);

    // Update schedule status
    if (schedule.type === 'once') {
      schedule.status = 'completed';
      schedule.completedAt = Date.now();
      this.schedules.set(schedule.id, schedule);
      this.notifyListeners('schedule:completed', schedule);
    } else if (schedule.type === 'recurring') {
      // Calculate next occurrence
      const nextOccurrence = this.calculateNextOccurrence(schedule);
      
      if (nextOccurrence) {
        schedule.scheduledAt = nextOccurrence;
        this.schedules.set(schedule.id, schedule);
        this.notifyListeners('schedule:recurred', schedule);
      } else {
        // Recurrence ended
        schedule.status = 'completed';
        schedule.completedAt = Date.now();
        this.schedules.set(schedule.id, schedule);
        this.notifyListeners('schedule:completed', schedule);
      }
    }

    // Check for expiration
    if (schedule.expiration && new Date(schedule.expiration).getTime() < now) {
      if (schedule.autoArchive) {
        this.notifyListeners('page:archived', { pageId: schedule.pageId });
      }
    }
  }

  /**
   * Calculate next occurrence for recurring schedule
   * @param {Object} schedule - Schedule configuration
   * @returns {Date|null} Next occurrence date or null
   */
  calculateNextOccurrence(schedule) {
    const current = new Date(schedule.scheduledAt);
    const now = Date.now();

    // Check if recurrence has ended
    if (schedule.recurrenceEnd && new Date(schedule.recurrenceEnd).getTime() < now) {
      return null;
    }

    let next = new Date(current);

    switch (schedule.recurrence) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      default:
        return null;
    }

    return next.toISOString();
  }

  /**
   * Start schedule checker
   */
  startScheduleChecker() {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      this.processScheduledPublishing();
    }, 60000); // Check every minute
  }

  /**
   * Stop schedule checker
   */
  stopScheduleChecker() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Get schedule statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const schedules = Array.from(this.schedules.values());
    const now = Date.now();
    
    return {
      totalSchedules: schedules.length,
      pending: schedules.filter(s => s.status === 'scheduled' && new Date(s.scheduledAt).getTime() > now).length,
      overdue: schedules.filter(s => s.status === 'scheduled' && new Date(s.scheduledAt).getTime() < now).length,
      completed: schedules.filter(s => s.status === 'completed').length,
      cancelled: schedules.filter(s => s.status === 'cancelled').length,
      byType: {
        once: schedules.filter(s => s.type === 'once').length,
        recurring: schedules.filter(s => s.type === 'recurring').length,
      },
    };
  }

  /**
   * Generate a unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

const scheduledPublishingManager = new ScheduledPublishingManager();
export default scheduledPublishingManager;
