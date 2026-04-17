import api from './api';

// Asset Categories
export const getAssetCategories = (params) => api.get('/asset-categories', { params });
export const getAssetCategory = (id) => api.get(`/asset-categories/${id}`);
export const createAssetCategory = (data) => api.post('/asset-categories', data);
export const updateAssetCategory = (id, data) => api.put(`/asset-categories/${id}`, data);
export const deleteAssetCategory = (id) => api.delete(`/asset-categories/${id}`);

// Assets
export const getAssets = (params) => api.get('/assets', { params });
export const getAsset = (id) => api.get(`/assets/${id}`);
export const createAsset = (data) => api.post('/assets', data);
export const updateAsset = (id, data) => api.put(`/assets/${id}`, data);
export const deleteAsset = (id) => api.delete(`/assets/${id}`);
export const assignAsset = (id, data) => api.put(`/assets/${id}/assign`, data);
export const transferAsset = (id, data) => api.put(`/assets/${id}/transfer`, data);
export const addAssetMaintenance = (id, data) => api.post(`/assets/${id}/maintenance`, data);
export const disposeAsset = (id, data) => api.post(`/assets/${id}/dispose`, data);
export const runDepreciation = () => api.post('/assets/run-depreciation');
export const getAssetSummary = () => api.get('/assets/summary');
