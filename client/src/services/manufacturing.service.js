import api from './api';

// Production Plans
export const getPlans = (params) => api.get('/manufacturing', { params });
export const createPlan = (data) => api.post('/manufacturing/plans', data);
export const updatePlan = (id, data) => api.put(`/manufacturing/plans/${id}`, data);
export const deletePlan = (id) => api.delete(`/manufacturing/plans/${id}`);

// Work Orders
export const getWorkOrders = (params) => api.get('/manufacturing/work-orders', { params });
export const createWorkOrder = (data) => api.post('/manufacturing/work-orders', data);
export const updateWorkOrder = (id, data) => api.put(`/manufacturing/work-orders/${id}`, data);
export const deleteWorkOrder = (id) => api.delete(`/manufacturing/work-orders/${id}`);

// BOM
export const getBOMs = (params) => api.get('/manufacturing/bom', { params });
export const createBOM = (data) => api.post('/manufacturing/bom', data);
export const updateBOM = (id, data) => api.put(`/manufacturing/bom/${id}`, data);
export const deleteBOM = (id) => api.delete(`/manufacturing/bom/${id}`);

// Subcontracting Items
export const getSubcontractingItems = (params) => api.get('/manufacturing/subcontracting-items', { params });
export const createSubcontractingItem = (data) => api.post('/manufacturing/subcontracting-items', data);
export const updateSubcontractingItem = (id, data) => api.put(`/manufacturing/subcontracting-items/${id}`, data);
export const deleteSubcontractingItem = (id) => api.delete(`/manufacturing/subcontracting-items/${id}`);

// Subcontracting Orders
export const getSubcontractingOrders = (params) => api.get('/manufacturing/subcontracting-orders', { params });
export const createSubcontractingOrder = (data) => api.post('/manufacturing/subcontracting-orders', data);
export const updateSubcontractingOrder = (id, data) => api.put(`/manufacturing/subcontracting-orders/${id}`, data);
export const deleteSubcontractingOrder = (id) => api.delete(`/manufacturing/subcontracting-orders/${id}`);

// Work Centers
export const getWorkCenters = (params) => api.get('/manufacturing/work-centers', { params });
export const createWorkCenter = (data) => api.post('/manufacturing/work-centers', data);
export const updateWorkCenter = (id, data) => api.put(`/manufacturing/work-centers/${id}`, data);
export const deleteWorkCenter = (id) => api.delete(`/manufacturing/work-centers/${id}`);

// Summary & Capacity
export const getManufacturingSummary = () => api.get('/manufacturing/summary');
export const getCapacitySummary = () => api.get('/manufacturing/capacity');
