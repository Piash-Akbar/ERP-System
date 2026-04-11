import api from './api';

export const getCNFs = (params) => api.get('/cnf', { params });
export const getCNF = (id) => api.get(`/cnf/${id}`);
export const createCNF = (data) => api.post('/cnf', data);
export const updateCNF = (id, data) => api.put(`/cnf/${id}`, data);
export const deleteCNF = (id) => api.delete(`/cnf/${id}`);
