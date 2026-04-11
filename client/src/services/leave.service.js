import api from './api';

// Leave Types
export const getLeaveTypes = () => api.get('/leave/types');
export const createLeaveType = (data) => api.post('/leave/types', data);
export const updateLeaveType = (id, data) => api.put(`/leave/types/${id}`, data);
export const deleteLeaveType = (id) => api.delete(`/leave/types/${id}`);

// Leave Applications
export const getLeaveApplications = (params) => api.get('/leave', { params });
export const createLeaveApplication = (data) => api.post('/leave', data);
export const approveLeaveApplication = (id) => api.put(`/leave/${id}/approve`);
export const rejectLeaveApplication = (id, data) => api.put(`/leave/${id}/reject`, data);

// Balance
export const getLeaveBalance = (staffId) => api.get(`/leave/balance/${staffId}`);

// Holidays
export const getHolidays = () => api.get('/leave/holidays');
export const createHoliday = (data) => api.post('/leave/holidays', data);
export const deleteHoliday = (id) => api.delete(`/leave/holidays/${id}`);
