import api from './api';

export const notificationApi = {
  // Get notifications for current user
  getNotifications: async () => {
    const response = await api.get('/api/user/notifications');
    return response.data;
  },

  // Get admin notifications
  getAdminNotifications: async () => {
    const response = await api.get('/api/admin/notifications');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await api.put(`/api/user/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark admin notification as read
  markAdminAsRead: async (notificationId) => {
    const response = await api.put(`/api/admin/notifications/${notificationId}/read`);
    return response.data;
  },
};
