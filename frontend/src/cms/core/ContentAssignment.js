/**
 * Content Assignment Manager
 * Manages content assignment with owner, reviewer, publisher, deadline, priority, and notifications
 */

class ContentAssignmentManager {
  constructor() {
    this.assignments = new Map();
    this.listeners = [];
  }

  /**
   * Create an assignment
   * @param {Object} assignment - Assignment configuration
   * @returns {string} Assignment ID
   */
  createAssignment(assignment) {
    const id = assignment.id || this.generateId();
    
    const newAssignment = {
      id,
      pageId: assignment.pageId,
      owner: assignment.owner,
      reviewers: assignment.reviewers || [],
      publisher: assignment.publisher || null,
      deadline: assignment.deadline || null,
      priority: assignment.priority || 'medium',
      status: assignment.status || 'assigned',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      notifications: {
        assigned: true,
        deadlineReminder: true,
        overdue: true,
        statusChange: true,
      },
    };

    this.assignments.set(id, newAssignment);
    this.notifyListeners('assignment:created', newAssignment);
    return id;
  }

  /**
   * Get an assignment
   * @param {string} id - Assignment ID
   * @returns {Object|null} Assignment or null
   */
  getAssignment(id) {
    return this.assignments.get(id) || null;
  }

  /**
   * Get assignment for a page
   * @param {string} pageId - Page ID
   * @returns {Object|null} Assignment or null
   */
  getAssignmentForPage(pageId) {
    const assignments = Array.from(this.assignments.values());
    return assignments.find(a => a.pageId === pageId) || null;
  }

  /**
   * Get assignments for a user
   * @param {string} userId - User ID
   * @returns {Array} Array of assignments
   */
  getAssignmentsForUser(userId) {
    return Array.from(this.assignments.values()).filter(
      assignment => 
        assignment.owner === userId ||
        assignment.reviewers.includes(userId) ||
        assignment.publisher === userId
    );
  }

  /**
   * Get assignments by role
   * @param {string} userId - User ID
   * @param {string} role - Role (owner, reviewer, publisher)
   * @returns {Array} Array of assignments
   */
  getAssignmentsByRole(userId, role) {
    return Array.from(this.assignments.values()).filter(
      assignment => assignment[role] === userId || 
        (role === 'reviewer' && assignment.reviewers.includes(userId))
    );
  }

  /**
   * Update assignment
   * @param {string} id - Assignment ID
   * @param {Object} updates - Updates to apply
   */
  updateAssignment(id, updates) {
    const assignment = this.assignments.get(id);
    if (!assignment) return;

    Object.assign(assignment, updates);
    assignment.updatedAt = Date.now();
    this.assignments.set(id, assignment);
    this.notifyListeners('assignment:updated', assignment);
  }

  /**
   * Update assignment status
   * @param {string} id - Assignment ID
   * @param {string} status - New status
   */
  updateStatus(id, status) {
    this.updateAssignment(id, { status });
  }

  /**
   * Update assignment priority
   * @param {string} id - Assignment ID
   * @param {string} priority - New priority (low, medium, high, urgent)
   */
  updatePriority(id, priority) {
    this.updateAssignment(id, { priority });
  }

  /**
   * Update assignment deadline
   * @param {string} id - Assignment ID
   * @param {Date} deadline - New deadline
   */
  updateDeadline(id, deadline) {
    this.updateAssignment(id, { deadline });
  }

  /**
   * Add reviewer to assignment
   * @param {string} id - Assignment ID
   * @param {string} userId - User ID
   */
  addReviewer(id, userId) {
    const assignment = this.assignments.get(id);
    if (!assignment) return;

    if (!assignment.reviewers.includes(userId)) {
      assignment.reviewers.push(userId);
      assignment.updatedAt = Date.now();
      this.assignments.set(id, assignment);
      this.notifyListeners('assignment:reviewer_added', assignment);
    }
  }

  /**
   * Remove reviewer from assignment
   * @param {string} id - Assignment ID
   * @param {string} userId - User ID
   */
  removeReviewer(id, userId) {
    const assignment = this.assignments.get(id);
    if (!assignment) return;

    const index = assignment.reviewers.indexOf(userId);
    if (index > -1) {
      assignment.reviewers.splice(index, 1);
      assignment.updatedAt = Date.now();
      this.assignments.set(id, assignment);
      this.notifyListeners('assignment:reviewer_removed', assignment);
    }
  }

  /**
   * Set publisher for assignment
   * @param {string} id - Assignment ID
   * @param {string} userId - User ID
   */
  setPublisher(id, userId) {
    this.updateAssignment(id, { publisher: userId });
  }

  /**
   * Update notification settings
   * @param {string} id - Assignment ID
   * @param {Object} settings - Notification settings
   */
  updateNotifications(id, settings) {
    const assignment = this.assignments.get(id);
    if (!assignment) return;

    assignment.notifications = { ...assignment.notifications, ...settings };
    assignment.updatedAt = Date.now();
    this.assignments.set(id, assignment);
    this.notifyListeners('assignment:notifications_updated', assignment);
  }

  /**
   * Get overdue assignments
   * @returns {Array} Array of overdue assignments
   */
  getOverdueAssignments() {
    const now = Date.now();
    return Array.from(this.assignments.values()).filter(
      assignment => 
        assignment.deadline && 
        new Date(assignment.deadline).getTime() < now &&
        assignment.status !== 'completed'
    );
  }

  /**
   * Get assignments due soon
   * @param {number} hours - Hours threshold
   * @returns {Array} Array of assignments due soon
   */
  getAssignmentsDueSoon(hours = 24) {
    const now = Date.now();
    const threshold = hours * 60 * 60 * 1000;
    
    return Array.from(this.assignments.values()).filter(
      assignment => 
        assignment.deadline && 
        new Date(assignment.deadline).getTime() - now < threshold &&
        new Date(assignment.deadline).getTime() > now &&
        assignment.status !== 'completed'
    );
  }

  /**
   * Get assignments by priority
   * @param {string} priority -Priority level
   * @returns {Array} Array of assignments
   */
  getAssignmentsByPriority(priority) {
    return Array.from(this.assignments.values()).filter(
      assignment => assignment.priority === priority
    );
  }

  /**
   * Get assignments by status
   * @param {string} status - Status
   * @returns {Array} Array of assignments
   */
  getAssignmentsByStatus(status) {
    return Array.from(this.assignments.values()).filter(
      assignment => assignment.status === status
    );
  }

  /**
   * Delete assignment
   * @param {string} id - Assignment ID
   */
  deleteAssignment(id) {
    this.assignments.delete(id);
    this.notifyListeners('assignment:deleted', { id });
  }

  /**
   * Get assignment statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const assignments = Array.from(this.assignments.values());
    
    return {
      totalAssignments: assignments.length,
      byStatus: {
        assigned: assignments.filter(a => a.status === 'assigned').length,
        inProgress: assignments.filter(a => a.status === 'in_progress').length,
        completed: assignments.filter(a => a.status === 'completed').length,
      },
      byPriority: {
        low: assignments.filter(a => a.priority === 'low').length,
        medium: assignments.filter(a => a.priority === 'medium').length,
        high: assignments.filter(a => a.priority === 'high').length,
        urgent: assignments.filter(a => a.priority === 'urgent').length,
      },
      overdue: this.getOverdueAssignments().length,
      dueSoon: this.getAssignmentsDueSoon().length,
    };
  }

  /**
   * Generate a unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

// Singleton instance
const contentAssignmentManager = new ContentAssignmentManager();

export default contentAssignmentManager;
export { ContentAssignmentManager };
