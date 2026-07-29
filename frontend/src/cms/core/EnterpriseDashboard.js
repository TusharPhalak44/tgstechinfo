/**
 * Enterprise Dashboard Manager
 * Central dashboard displaying pages, drafts, reviews, approvals, analytics, assignments, notifications, activity
 */

class EnterpriseDashboardManager {
  constructor() {
    this.widgets = new Map();
    this.listeners = [];
    this.initializeWidgets();
  }

  initializeWidgets() {
    ['pages', 'drafts', 'reviews', 'approvals', 'scheduled', 'published'].forEach((id, i) => {
      this.widgets.set(id, { id, type: 'stat', value: 0, order: i + 1 });
    });
    this.widgets.set('activity', { id: 'activity', type: 'timeline', items: [], order: 7 });
    this.widgets.set('notifications', { id: 'notifications', type: 'list', items: [], order: 8 });
  }

  getDashboardData() {
    return { widgets: Array.from(this.widgets.values()).sort((a, b) => a.order - b.order) };
  }

  updateWidget(widgetId, value) {
    const widget = this.widgets.get(widgetId);
    if (widget) {
      widget.value = value;
      this.notifyListeners('widget:updated', widget);
    }
  }

  addActivity(activity) {
    const widget = this.widgets.get('activity');
    if (widget) {
      widget.items.unshift({ id: this.generateId(), ...activity, timestamp: Date.now() });
      this.notifyListeners('widget:updated', widget);
    }
  }

  addNotification(notification) {
    const widget = this.widgets.get('notifications');
    if (widget) {
      widget.items.unshift({ id: this.generateId(), ...notification, timestamp: Date.now(), read: false });
      this.notifyListeners('widget:updated', widget);
    }
  }

  generateId() {
    return `dash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  notifyListeners(event, data) {
    this.listeners.forEach(listener => listener(event, data));
  }
}

const enterpriseDashboardManager = new EnterpriseDashboardManager();
export default enterpriseDashboardManager;
