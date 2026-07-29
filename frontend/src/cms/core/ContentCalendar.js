/**
 * Content Calendar Manager
 * Monthly/weekly agenda, timeline, drag pages between dates
 */

class ContentCalendarManager {
  constructor() {
    this.events = new Map();
    this.listeners = [];
  }

  /**
   * Create a calendar event
   * @param {Object} event - Event configuration
   * @returns {string} Event ID
   */
  createEvent(event) {
    const id = event.id || this.generateId();
    
    const newEvent = {
      id,
      pageId: event.pageId,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      allDay: event.allDay || false,
      status: event.status || 'draft', // draft, scheduled, published
      color: event.color || '#1890ff',
      assignedTo: event.assignedTo || null,
      createdAt: Date.now(),
    };

    this.events.set(id, newEvent);
    this.notifyListeners('event:created', newEvent);
    return id;
  }

  /**
   * Get an event
   * @param {string} id - Event ID
   * @returns {Object|null} Event or null
   */
  getEvent(id) {
    return this.events.get(id) || null;
  }

  /**
   * Get all events
   * @returns {Array} Array of events
   */
  getAllEvents() {
    return Array.from(this.events.values());
  }

  /**
   * Get events for date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Array of events
   */
  getEventsForDateRange(startDate, endDate) {
    const start = startDate.getTime();
    const end = endDate.getTime();
    
    return Array.from(this.events.values()).filter(event => {
      const eventStart = new Date(event.startDate).getTime();
      const eventEnd = new Date(event.endDate).getTime();
      return eventStart >= start && eventEnd <= end;
    });
  }

  /**
   * Get events for month
   * @param {number} year - Year
   * @param {number} month - Month (0-11)
   * @returns {Array} Array of events
   */
  getEventsForMonth(year, month) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    return this.getEventsForDateRange(startDate, endDate);
  }

  /**
   * Get events for week
   * @param {Date} date - Date in the week
   * @returns {Array} Array of events
   */
  getEventsForWeek(date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const startDate = new Date(date.setDate(diff));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    return this.getEventsForDateRange(startDate, endDate);
  }

  /**
   * Get events for day
   * @param {Date} date - Date
   * @returns {Array} Array of events
   */
  getEventsForDay(date) {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    return this.getEventsForDateRange(startOfDay, endOfDay);
  }

  /**
   * Update event
   * @param {string} id - Event ID
   * @param {Object} updates - Updates to apply
   */
  updateEvent(id, updates) {
    const event = this.events.get(id);
    if (!event) return;

    Object.assign(event, updates);
    this.events.set(id, event);
    this.notifyListeners('event:updated', event);
  }

  /**
   * Move event to new date
   * @param {string} id - Event ID
   * @param {Date} newStartDate - New start date
   * @param {Date} newEndDate - New end date
   */
  moveEvent(id, newStartDate, newEndDate) {
    this.updateEvent(id, {
      startDate: newStartDate,
      endDate: newEndDate,
    });
  }

  /**
   * Delete event
   * @param {string} id - Event ID
   */
  deleteEvent(id) {
    this.events.delete(id);
    this.notifyListeners('event:deleted', { id });
  }

  /**
   * Get events by status
   * @param {string} status - Status
   * @returns {Array} Array of events
   */
  getEventsByStatus(status) {
    return Array.from(this.events.values()).filter(
      event => event.status === status
    );
  }

  /**
   * Get events for user
   * @param {string} userId - User ID
   * @returns {Array} Array of events
   */
  getEventsForUser(userId) {
    return Array.from(this.events.values()).filter(
      event => event.assignedTo === userId
    );
  }

  /**
   * Get calendar statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const events = Array.from(this.events.values());
    
    return {
      totalEvents: events.length,
      byStatus: {
        draft: events.filter(e => e.status === 'draft').length,
        scheduled: events.filter(e => e.status === 'scheduled').length,
        published: events.filter(e => e.status === 'published').length,
      },
      thisMonth: this.getEventsForMonth(
        new Date().getFullYear(),
        new Date().getMonth()
      ).length,
      thisWeek: this.getEventsForWeek(new Date()).length,
      today: this.getEventsForDay(new Date()).length,
    };
  }

  /**
   * Generate a unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

const contentCalendarManager = new ContentCalendarManager();
export default contentCalendarManager;
