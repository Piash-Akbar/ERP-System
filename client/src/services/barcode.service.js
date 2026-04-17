import api from './api';

export const getDashboardStats = () => api.get('/barcodes/stats');
export const getBarcodeLogs = (params) => api.get('/barcodes', { params });
export const getUnassigned = (params) => api.get('/barcodes/unassigned', { params });
export const generateBarcode = (data) => api.post('/barcodes/generate', data);
export const generateBulk = (data) => api.post('/barcodes/generate-bulk', data);
export const lookupBarcode = (code) => api.get(`/barcodes/lookup/${code}`);
export const checkDuplicate = (barcode) => api.get('/barcodes/check-duplicate', { params: { barcode } });
export const assignBarcode = (data) => api.put('/barcodes/assign', data);
export const getPrintData = (productIds) => api.get('/barcodes/print-data', { params: { productIds: productIds.join(',') } });
export const logPrint = (barcodes) => api.post('/barcodes/log-print', { barcodes });
