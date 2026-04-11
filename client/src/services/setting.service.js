import api from './api';

export const getSettings = () => api.get('/settings');
export const getSettingsByGroup = (group) => api.get(`/settings/group/${group}`);
export const updateSettings = (settings) => api.put('/settings', { settings });
export const getPublicSettings = () => api.get('/settings/public');

export const uploadLogo = (file) => {
  const formData = new FormData();
  formData.append('logo', file);
  return api.post('/settings/upload-logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
