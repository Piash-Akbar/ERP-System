import api from './api';

export const getNotifications = (params) => api.get('/notifications', { params });
export const getUnreadCount = () => api.get('/notifications/unread-count');
export const markAsRead = (id) => api.put(`/notifications/${id}`);
export const markAllAsRead = () => api.put('/notifications/mark-all-read');
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);
