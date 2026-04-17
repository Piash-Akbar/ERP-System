import api from './api';

// Approval Requests
export const getApprovals = (params) => api.get('/approvals', { params });
export const getPendingApprovals = (params) => api.get('/approvals/pending', { params });
export const getMySubmissions = (params) => api.get('/approvals/my-submissions', { params });
export const getApproval = (id) => api.get(`/approvals/${id}`);
export const submitApproval = (data) => api.post('/approvals/submit', data);
export const approveRequest = (id, data) => api.post(`/approvals/${id}/approve`, data);
export const rejectRequest = (id, data) => api.post(`/approvals/${id}/reject`, data);
export const holdRequest = (id, data) => api.post(`/approvals/${id}/hold`, data);
export const cancelRequest = (id) => api.post(`/approvals/${id}/cancel`);
export const escalateRequest = (id, data) => api.post(`/approvals/${id}/escalate`, data);

// Approval Rules
export const getApprovalRules = (params) => api.get('/approval-rules', { params });
export const getApprovalRule = (id) => api.get(`/approval-rules/${id}`);
export const createApprovalRule = (data) => api.post('/approval-rules', data);
export const updateApprovalRule = (id, data) => api.put(`/approval-rules/${id}`, data);
export const deleteApprovalRule = (id) => api.delete(`/approval-rules/${id}`);
