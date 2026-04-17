import api from './api';

export const getUsers = (params) => api.get('/users', { params });
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const toggleUserStatus = (id, isActive) => api.put(`/users/${id}/status`, { isActive });
export const resetUserPassword = (id, newPassword) => api.post(`/users/${id}/reset-password`, { newPassword });
export const getRoles = () => api.get('/auth/roles');
export const getBranches = (params) => api.get('/branches', { params });
