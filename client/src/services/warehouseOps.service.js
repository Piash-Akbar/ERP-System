import api from './api';

const BASE = '/warehouse-ops';

// Dashboard
export const getWarehouseDashboard = (params) => api.get(`${BASE}/dashboard`, { params });
export const getStockMovementChart = (params) => api.get(`${BASE}/dashboard/stock-movement`, { params });
export const getStockByCategory = (params) => api.get(`${BASE}/dashboard/stock-by-category`, { params });

// Goods Receiving
export const getReceivings = (params) => api.get(`${BASE}/receiving`, { params });
export const getReceivingById = (id) => api.get(`${BASE}/receiving/${id}`);
export const createReceiving = (data) => api.post(`${BASE}/receiving`, data);
export const completeReceiving = (id) => api.put(`${BASE}/receiving/${id}/complete`);
export const cancelReceiving = (id) => api.put(`${BASE}/receiving/${id}/cancel`);

// Goods Issue
export const getIssues = (params) => api.get(`${BASE}/issue`, { params });
export const getIssueById = (id) => api.get(`${BASE}/issue/${id}`);
export const createIssue = (data) => api.post(`${BASE}/issue`, data);
export const completeIssue = (id) => api.put(`${BASE}/issue/${id}/complete`);
export const cancelIssue = (id) => api.put(`${BASE}/issue/${id}/cancel`);

// Warehouse Transfer
export const getWarehouseTransfers = (params) => api.get(`${BASE}/transfer`, { params });
export const getPendingTransfers = (params) => api.get(`${BASE}/transfer/pending`, { params });
export const getTransferById = (id) => api.get(`${BASE}/transfer/${id}`);
export const createWarehouseTransfer = (data) => api.post(`${BASE}/transfer`, data);
export const completeTransfer = (id) => api.put(`${BASE}/transfer/${id}/complete`);
export const cancelTransfer = (id) => api.put(`${BASE}/transfer/${id}/cancel`);

// Stock Reconciliation
export const getReconciliation = (params) => api.get(`${BASE}/reconciliation`, { params });
export const applyReconciliation = (data) => api.post(`${BASE}/reconciliation/adjust`, data);

// Physical Stock Count
export const getCountSessions = (params) => api.get(`${BASE}/stock-count`, { params });
export const getCountSessionById = (id) => api.get(`${BASE}/stock-count/${id}`);
export const createCountSession = (data) => api.post(`${BASE}/stock-count`, data);
export const startCountSession = (id) => api.put(`${BASE}/stock-count/${id}/start`);
export const scanCountItem = (id, data) => api.put(`${BASE}/stock-count/${id}/scan`, data);
export const completeCountSession = (id) => api.put(`${BASE}/stock-count/${id}/complete`);
export const resetCountSession = (id) => api.put(`${BASE}/stock-count/${id}/reset`);

// Warehouse Ledger
export const getLedger = (params) => api.get(`${BASE}/ledger`, { params });
export const exportLedgerCSV = (params) => api.get(`${BASE}/ledger/export`, { params, responseType: 'blob' });

// Warehouse Returns
export const getReturns = (params) => api.get(`${BASE}/returns`, { params });
export const getReturnById = (id) => api.get(`${BASE}/returns/${id}`);
export const createReturn = (data) => api.post(`${BASE}/returns`, data);
export const completeReturn = (id) => api.put(`${BASE}/returns/${id}/complete`);
export const cancelReturn = (id) => api.put(`${BASE}/returns/${id}/cancel`);

// Settings
export const getWarehouseSettings = (params) => api.get(`${BASE}/settings`, { params });
export const updateWarehouseSettings = (data) => api.put(`${BASE}/settings`, data);

// Barcode Scan
export const scanBarcode = (barcode) => api.post(`${BASE}/scan`, { barcode });
