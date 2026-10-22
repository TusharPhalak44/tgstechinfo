import api from './api';

export const eventService = {
  // Public APIs
  getPublicEvents: async (params = {}) => {
    const res = await api.get('/api/public/events', { params });
    return res.data;
  },

  getPublicEventBySlug: async (slug) => {
    const res = await api.get(`/api/public/events/${slug}`);
    return res.data;
  },

  registerForEvent: async (eventId, data) => {
    const res = await api.post(`/api/public/events/${eventId}/register`, data);
    return res.data;
  },

  getCalendarDownloadUrl: (eventId) => {
    return `/api/public/events/${eventId}/calendar.ics`;
  },

  // Admin APIs
  getAdminEvents: async (params = {}) => {
    const res = await api.get('/api/events/admin/all', { params });
    return res.data;
  },

  getAdminEventById: async (id) => {
    const res = await api.get(`/api/events/admin/single/${id}`);
    return res.data;
  },

  createEvent: async (data) => {
    const res = await api.post('/api/events/admin/create', data);
    return res.data;
  },

  updateEvent: async (id, data) => {
    const res = await api.put(`/api/events/admin/update/${id}`, data);
    return res.data;
  },

  deleteEvent: async (id) => {
    const res = await api.delete(`/api/events/admin/delete/${id}`);
    return res.data;
  },

  getEventAttendees: async (eventId, params = {}) => {
    const res = await api.get(`/api/events/admin/${eventId}/attendees`, { params });
    return res.data;
  },

  updateAttendeeStatus: async (registrationId, status) => {
    const res = await api.patch(`/api/events/admin/attendees/${registrationId}/status`, { status });
    return res.data;
  },

  getExportCsvUrl: (eventId) => {
    return `/api/events/admin/${eventId}/export-csv`;
  }
};

export default eventService;
