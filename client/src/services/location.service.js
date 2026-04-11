import api from './api';

// Branch API calls
export const getBranches = () => api.get('/branches');
export const getBranch = (id) => api.get(`/branches/${id}`);
export const createBranch = (data) => api.post('/branches', data);
export const updateBranch = (id, data) => api.put(`/branches/${id}`, data);
export const deleteBranch = (id) => api.delete(`/branches/${id}`);

// Warehouse API calls
export const getWarehouses = (params) => api.get('/warehouses', { params });
export const getWarehouse = (id) => api.get(`/warehouses/${id}`);
export const createWarehouse = (data) => api.post('/warehouses', data);
export const updateWarehouse = (id, data) => api.put(`/warehouses/${id}`, data);
export const deleteWarehouse = (id) => api.delete(`/warehouses/${id}`);
