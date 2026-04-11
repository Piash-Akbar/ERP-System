import api from './api';

// Staff
export const getStaff = (params) => api.get('/hrm', { params });
export const getStaffById = (id) => api.get(`/hrm/${id}`);
export const createStaff = (data) => api.post('/hrm', data);
export const updateStaff = (id, data) => api.put(`/hrm/${id}`, data);
export const deleteStaff = (id) => api.delete(`/hrm/${id}`);

// Attendance
export const getAttendance = (params) => api.get('/hrm/attendance', { params });
export const markAttendance = (data) => api.post('/hrm/attendance', data);
export const getStaffAttendance = (staffId, params) => api.get(`/hrm/attendance/${staffId}`, { params });

// Payroll
export const getPayroll = (params) => api.get('/hrm/payroll', { params });
export const generatePayroll = (data) => api.post('/hrm/payroll/generate', data);
export const approvePayroll = (id) => api.put(`/hrm/payroll/${id}/approve`);
export const markPayrollPaid = (id) => api.put(`/hrm/payroll/${id}/pay`);

// Loans
export const getLoans = (params) => api.get('/hrm/loans', { params });
export const createLoan = (data) => api.post('/hrm/loans', data);
export const getLoansByStaff = (staffId) => api.get(`/hrm/loans/staff/${staffId}`);
