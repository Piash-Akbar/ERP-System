import api from './api';

export const getDocuments = (params) => api.get('/documents', { params });
export const getDocument = (id) => api.get(`/documents/${id}`);
export const uploadDocument = (formData) => api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateDocument = (id, data) => api.put(`/documents/${id}`, data);
export const uploadNewVersion = (id, formData) => api.post(`/documents/${id}/new-version`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteDocument = (id) => api.delete(`/documents/${id}`);
export const getLinkedDocuments = (module, id) => api.get(`/documents/linked/${module}/${id}`);
export const linkDocument = (id, data) => api.post(`/documents/${id}/link`, data);
export const getExpiringDocuments = (params) => api.get('/documents/expiring', { params });
