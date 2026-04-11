import api from './api';

export const loginUser = (credentials) => api.post('/auth/login', credentials);

export const registerUser = (userData) => api.post('/auth/register', userData);

export const getProfile = () => api.get('/auth/profile');

export const updateProfile = (data) => api.put('/auth/profile', data);

export const changePassword = (data) => api.post('/auth/change-password', data);

export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });

export const resetPassword = (data) => api.post('/auth/reset-password', data);

export const logoutUser = () => api.post('/auth/logout');
