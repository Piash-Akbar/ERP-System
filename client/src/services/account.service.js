import api from './api';

// Transactions
export const getTransactions = (params) => api.get('/accounts/transactions', { params });
export const createTransaction = (data) => api.post('/accounts/transactions', data);
export const deleteTransaction = (id) => api.delete(`/accounts/transactions/${id}`);

// Bank Accounts
export const getBankAccounts = (params) => api.get('/accounts/bank-accounts', { params });
export const createBankAccount = (data) => api.post('/accounts/bank-accounts', data);
export const updateBankAccount = (id, data) => api.put(`/accounts/bank-accounts/${id}`, data);
export const deleteBankAccount = (id) => api.delete(`/accounts/bank-accounts/${id}`);

// Summary
export const getAccountSummary = (params) => api.get('/accounts/summary', { params });

// Expenses
export const getExpenses = (params) => api.get('/accounts/expenses', { params });
export const createExpense = (data) => api.post('/accounts/expenses', data);
export const deleteExpense = (id) => api.delete(`/accounts/expenses/${id}`);

// Income
export const getIncomes = (params) => api.get('/accounts/incomes', { params });
export const createIncome = (data) => api.post('/accounts/incomes', data);
export const deleteIncome = (id) => api.delete(`/accounts/incomes/${id}`);

// Chart of Accounts
export const getChartOfAccounts = (params) => api.get('/accounts/chart', { params });
export const createChartAccount = (data) => api.post('/accounts/chart', data);
export const deleteChartAccount = (id) => api.delete(`/accounts/chart/${id}`);

// Profit & Loss
export const getProfitLoss = (params) => api.get('/accounts/profit-loss', { params });
