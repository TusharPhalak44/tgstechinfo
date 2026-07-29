/**
 * Activity Timeline Manager
 * Tracks created, updated, published, deleted, restored, comments, assignments, approvals, history
 */

class ActivityTimelineManager {
  constructor() {
    this.activities = new Map();
    this.listeners = [];
  }

  /**
   * Record an activity
   * @param {Object} activity - Activity configuration
   * @returns {string} Activity ID
   */
  recordActivity(activity) {
    const id = activity.id || this.generateId();
    
    const newActivity = {
      id,
      type: activity.type, // created, updated, published, deleted, restored, commented, assigned, approved, rejected
      pageId: activity.pageId,
      userId: activity.userId,
      userName: activity.userName,
      description: activity.description,
      metadata: activity.metadata || {},
      timestamp: Date.now(),
    };

    this.activities.set(id, newActivity);
    this.notifyListeners('activity:recorded', newActivity);
    return id;
  }

  /**
   * Get an activity
   * @param {string} id - Activity ID
   * @returns {Object|null} Activity or null
   */
  getActivity(id) {
    return this.activities.get(id) || null;
  }

  /**
   * Get activities for a page
   * @param {string} pageId - Page ID
   * @returns {Array} Array of activities
   */
  getActivitiesForPage(pageId) {
    return Array.from(this.activities.values())
      .filter(activity => activity.pageId === pageId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get activities for a user
   * @param {string} userId - User ID
   * @returns {Array} Array of activities
   */
  getActivitiesForUser(userId) {
    return Array.from(this.activities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get activities by type
   * @param {string} type - Activity type
   * @returns {Array} Array of activities
   */
  getActivitiesByType(type) {
    return Array.from(this.activities.values())
      .filter(activity => activity.type === type)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get recent activities
   * @param {number} limit - Number of activities to return
   * @returns {Array} Array of recent activities
   */
  getRecentActivities(limit = 50) {
    return Array.from(this.activities.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get activities in date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Array of activities
   */
  getActivitiesInDateRange(startDate, endDate) {
    const start = startDate.getTime();
    const end = endDate.getTime();
    
    return Array.from(this.activities.values())
      .filter(activity => activity.timestamp >= start && activity.timestamp <= end)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Delete an activity
   * @param {string} id - Activity ID
   */
  deleteActivity(id) {
    this.activities.delete(id);
    this.notifyListeners('activity:deleted', { id });
  }

  /**
   * Clear old activities
   * @param {number} days - Number of days to keep
   */
  clearOldActivities(days = 90) {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    let deletedCount = 0;
    for (const [id, activity] of this.activities) {
      if (activity.timestamp < cutoff) {
        this.activities.delete(id);
        deletedCount++;
      }
    }

    this.notifyListeners('activities:cleared', { count: deletedCount });
  }

  /**
   * Get activity statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const activities = Array.from(this.activities.values());
    
    return {
      totalActivities: activities.length,
      byType: {
        created: activities.filter(a => a.type === 'created').length,
        updated: activities.filter(a => a.type === 'updated').length,
        published: activities.filter(a => a.type === 'published').length,
        deleted: activities.filter(a => a.type === 'deleted').length,
        restored: activities.filter(a => a.type === 'restored').length,
        commented: activities.filter(a => a.type === 'commented').length,
        assigned: activities.filter(a => a.type === 'assigned').length,
        approved: activities.filter(a => a.type === 'approved').length,
        rejected: activities.filter(a => a.type === 'rejected').length,
      },
    };
  }

  /**
   * Generate a unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

const activityTimelineManager = new ActivityTimelineManager();
export default activityTimelineManager;
