import api from './api';

export const getMoneyTransfers = (params) => api.get('/transfers', { params });
export const createMoneyTransfer = (data) => api.post('/transfers', data);
export const deleteMoneyTransfer = (id) => api.delete(`/transfers/${id}`);
