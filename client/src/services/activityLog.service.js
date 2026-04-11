import api from './api';

export const getActivityLogs = (params) => api.get('/activity-logs', { params });
