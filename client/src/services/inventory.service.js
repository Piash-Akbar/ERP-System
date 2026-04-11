import api from './api';

export const getStockList = (params) => api.get('/inventory', { params });
export const getLowStock = () => api.get('/inventory/low-stock');
export const adjustStock = (data) => api.post('/inventory/adjust', data);
export const transferStock = (data) => api.post('/inventory/transfer', data);
export const getAdjustments = (params) => api.get('/inventory/adjustments', { params });
export const getTransfers = (params) => api.get('/inventory/transfers', { params });
export const getOpeningStock = (params) => api.get('/inventory/opening-stock', { params });
export const addOpeningStock = (data) => api.post('/inventory/opening-stock', data);
export const getProductMovements = (params) => api.get('/inventory/movements', { params });
