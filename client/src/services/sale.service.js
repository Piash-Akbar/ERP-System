import api from './api';

export const getSales = (params) => api.get('/sales', { params });
export const getSale = (id) => api.get(`/sales/${id}`);
export const createSale = (data) => api.post('/sales', data);
export const addSalePayment = (id, data) => api.post(`/sales/${id}/payment`, data);
export const createSaleReturn = (id, data) => api.post(`/sales/${id}/return`, data);
export const updateSaleStatus = (id, status) => api.put(`/sales/${id}/status`, { status });
export const deleteSale = (id) => api.delete(`/sales/${id}`);
