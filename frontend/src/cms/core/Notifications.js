/**
 * Notifications Manager
 * Notify users when assigned, commented, approved, rejected, scheduled, published, autosaved, failed
 */

class NotificationsManager {
  constructor() {
    this.notifications = new Map();
    this.userNotifications = new Map();
    this.listeners = [];
  }

  /**
   * Create a notification
   * @param {Object} notification - Notification configuration
   * @returns {string} Notification ID
   */
  createNotification(notification) {
    const id = notification.id || this.generateId();
    
    const newNotification = {
      id,
      type: notification.type, // assigned, commented, approved, rejected, scheduled, published, autosaved, failed
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      pageId: notification.pageId || null,
      metadata: notification.metadata || {},
      read: false,
      createdAt: Date.now(),
    };

    this.notifications.set(id, newNotification);
    
    // Add to user notifications
    if (!this.userNotifications.has(notification.userId)) {
      this.userNotifications.set(notification.userId, []);
    }
    this.userNotifications.get(notification.userId).push(id);

    this.notifyListeners('notification:created', newNotification);
    return id;
  }

  /**
   * Get a notification
   * @param {string} id - Notification ID
   * @returns {Object|null} Notification or null
   */
  getNotification(id) {
    return this.notifications.get(id) || null;
  }

  /**
   * Get notifications for a user
   * @param {string} userId - User ID
   * @param {boolean} unreadOnly - Get only unread notifications
   * @returns {Array} Array of notifications
   */
  getNotificationsForUser(userId, unreadOnly = false) {
    const notificationIds = this.userNotifications.get(userId) || [];
    const notifications = notificationIds
      .map(id => this.notifications.get(id))
      .filter(Boolean);

    const filtered = unreadOnly 
      ? notifications.filter(n => !n.read)
      : notifications;

    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get unread count for user
   * @param {string} userId - User ID
   * @returns {number} Unread count
   */
  getUnreadCount(userId) {
    return this.getNotificationsForUser(userId, true).length;
  }

  /**
   * Mark notification as read
   * @param {string} id - Notification ID
   */
  markAsRead(id) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    notification.read = true;
    notification.readAt = Date.now();
    this.notifications.set(id, notification);
    this.notifyListeners('notification:read', notification);
  }

  /**
   * Mark all notifications as read for user
   * @param {string} userId - User ID
   */
  markAllAsRead(userId) {
    const notificationIds = this.userNotifications.get(userId) || [];
    notificationIds.forEach(id => {
      this.markAsRead(id);
    });
  }

  /**
   * Delete a notification
   * @param {string} id - Notification ID
   */
  deleteNotification(id) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    // Remove from user notifications
    const userNotifications = this.userNotifications.get(notification.userId) || [];
    const index = userNotifications.indexOf(id);
    if (index > -1) {
      userNotifications.splice(index, 1);
    }

    this.notifications.delete(id);
    this.notifyListeners('notification:deleted', { id });
  }

  /**
   * Clear old notifications
   * @param {number} days - Number of days to keep
   */
  clearOldNotifications(days = 30) {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    let deletedCount = 0;
    for (const [id, notification] of this.notifications) {
      if (notification.createdAt < cutoff && notification.read) {
        this.deleteNotification(id);
        deletedCount++;
      }
    }

    this.notifyListeners('notifications:cleared', { count: deletedCount });
  }

  /**
   * Notify user of assignment
   * @param {string} userId - User ID
   * @param {Object} context - Assignment context
   */
  notifyAssignment(userId, context) {
    this.createNotification({
      type: 'assigned',
      userId,
      title: 'New Assignment',
      message: `You have been assigned to "${context.pageName}"`,
      pageId: context.pageId,
      metadata: { assignmentId: context.assignmentId },
    });
  }

  /**
   * Notify user of comment
   * @param {string} userId - User ID
   * @param {Object} context - Comment context
   */
  notifyComment(userId, context) {
    this.createNotification({
      type: 'commented',
      userId,
      title: 'New Comment',
      message: `${context.userName} commented on "${context.pageName}"`,
      pageId: context.pageId,
      metadata: { commentId: context.commentId },
    });
  }

  /**
   * Notify user of approval
   * @param {string} userId - User ID
   * @param {Object} context - Approval context
   */
  notifyApproval(userId, context) {
    this.createNotification({
      type: 'approved',
      userId,
      title: 'Page Approved',
      message: `"${context.pageName}" has been approved`,
      pageId: context.pageId,
      metadata: { approvalId: context.approvalId },
    });
  }

  /**
   * Notify user of rejection
   * @param {string} userId - User ID
   * @param {Object} context - Rejection context
   */
  notifyRejection(userId, context) {
    this.createNotification({
      type: 'rejected',
      userId,
      title: 'Page Rejected',
      message: `"${context.pageName}" has been rejected: ${context.reason}`,
      pageId: context.pageId,
      metadata: { approvalId: context.approvalId },
    });
  }

  /**
   * Notify user of scheduled publish
   * @param {string} userId - User ID
   * @param {Object} context - Schedule context
   */
  notifyScheduled(userId, context) {
    this.createNotification({
      type: 'scheduled',
      userId,
      title: 'Page Scheduled',
      message: `"${context.pageName}" is scheduled for ${new Date(context.scheduledAt).toLocaleString()}`,
      pageId: context.pageId,
      metadata: { scheduleId: context.scheduleId },
    });
  }

  /**
   * Notify user of publish
   * @param {string} userId - User ID
   * @param {Object} context - Publish context
   */
  notifyPublished(userId, context) {
    this.createNotification({
      type: 'published',
      userId,
      title: 'Page Published',
      message: `"${context.pageName}" has been published`,
      pageId: context.pageId,
      metadata: { publishedAt: context.publishedAt },
    });
  }

  /**
   * Notify user of autosave
   * @param {string} userId - User ID
   * @param {Object} context - Autosave context
   */
  notifyAutosave(userId, context) {
    this.createNotification({
      type: 'autosaved',
      userId,
      title: 'Draft Autosaved',
      message: `Draft for "${context.pageName}" has been autosaved`,
      pageId: context.pageId,
      metadata: { savedAt: context.savedAt },
    });
  }

  /**
   * Notify user of failure
   * @param {string} userId - User ID
   * @param {Object} context - Failure context
   */
  notifyFailure(userId, context) {
    this.createNotification({
      type: 'failed',
      userId,
      title: 'Operation Failed',
      message: `${context.operation} failed: ${context.error}`,
      pageId: context.pageId,
      metadata: { error: context.error },
    });
  }

  /**
   * Get notification statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const notifications = Array.from(this.notifications.values());
    
    return {
      totalNotifications: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byType: {
        assigned: notifications.filter(n => n.type === 'assigned').length,
        commented: notifications.filter(n => n.type === 'commented').length,
        approved: notifications.filter(n => n.type === 'approved').length,
        rejected: notifications.filter(n => n.type === 'rejected').length,
        scheduled: notifications.filter(n => n.type === 'scheduled').length,
        published: notifications.filter(n => n.type === 'published').length,
        autosaved: notifications.filter(n => n.type === 'autosaved').length,
        failed: notifications.filter(n => n.type === 'failed').length,
      },
    };
  }

  /**
   * Generate a unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

const notificationsManager = new NotificationsManager();
export default notificationsManager;
