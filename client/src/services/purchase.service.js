import api from './api';

export const getPurchases = (params) => api.get('/purchases', { params });
export const getPurchase = (id) => api.get(`/purchases/${id}`);
export const createPurchase = (data) => api.post('/purchases', data);
export const addPurchasePayment = (id, data) => api.post(`/purchases/${id}/payment`, data);
export const createPurchaseReturn = (id, data) => api.post(`/purchases/${id}/return`, data);
export const updatePurchaseStatus = (id, status) => api.put(`/purchases/${id}/status`, { status });
export const deletePurchase = (id) => api.delete(`/purchases/${id}`);
