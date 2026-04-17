const asyncHandler = require('../utils/asyncHandler');
const accountService = require('../services/account.service');

const getTransactions = asyncHandler(async (req, res) => {
  const result = await accountService.getTransactions(req.query);
  res.json({
    success: true,
    data: result,
    message: 'Transactions retrieved',
  });
});

const createTransaction = asyncHandler(async (req, res) => {
  if (req.files && req.files.length > 0) {
    req.body.attachments = req.files.map((f) => `/uploads/${f.filename}`);
  }
  const transaction = await accountService.createTransaction(req.body, req.user._id);
  res.status(201).json({
    success: true,
    data: transaction,
    message: 'Transaction created',
  });
});

const deleteTransaction = asyncHandler(async (req, res) => {
  await accountService.deleteTransaction(req.params.id);
  res.json({
    success: true,
    data: null,
    message: 'Transaction deleted',
  });
});

const getBankAccounts = asyncHandler(async (req, res) => {
  const accounts = await accountService.getBankAccounts();
  res.json({
    success: true,
    data: accounts,
    message: 'Bank accounts retrieved',
  });
});

const createBankAccount = asyncHandler(async (req, res) => {
  const account = await accountService.createBankAccount(req.body);
  res.status(201).json({
    success: true,
    data: account,
    message: 'Bank account created',
  });
});

const updateBankAccount = asyncHandler(async (req, res) => {
  const account = await accountService.updateBankAccount(req.params.id, req.body);
  res.json({
    success: true,
    data: account,
    message: 'Bank account updated',
  });
});

const deleteBankAccount = asyncHandler(async (req, res) => {
  await accountService.deleteBankAccount(req.params.id);
  res.json({
    success: true,
    data: null,
    message: 'Bank account deleted',
  });
});

const getSummary = asyncHandler(async (req, res) => {
  const summary = await accountService.getSummary(req.query);
  res.json({
    success: true,
    data: summary,
    message: 'Account summary retrieved',
  });
});

// Expenses
const getExpenses = asyncHandler(async (req, res) => {
  const result = await accountService.getExpenses(req.query);
  res.json({ success: true, data: result, message: 'Expenses retrieved' });
});

const createExpense = asyncHandler(async (req, res) => {
  const expense = await accountService.createExpense(req.body, req.user._id);
  res.status(201).json({ success: true, data: expense, message: 'Expense created' });
});

const deleteExpense = asyncHandler(async (req, res) => {
  await accountService.deleteExpense(req.params.id);
  res.json({ success: true, data: null, message: 'Expense deleted' });
});

// Incomes
const getIncomes = asyncHandler(async (req, res) => {
  const result = await accountService.getIncomes(req.query);
  res.json({ success: true, data: result, message: 'Incomes retrieved' });
});

const createIncome = asyncHandler(async (req, res) => {
  const income = await accountService.createIncome(req.body, req.user._id);
  res.status(201).json({ success: true, data: income, message: 'Income created' });
});

const deleteIncome = asyncHandler(async (req, res) => {
  await accountService.deleteIncome(req.params.id);
  res.json({ success: true, data: null, message: 'Income deleted' });
});

// Chart of Accounts
const getChartOfAccounts = asyncHandler(async (req, res) => {
  const accounts = await accountService.getChartOfAccounts();
  res.json({ success: true, data: accounts, message: 'Chart of accounts retrieved' });
});

const createChartAccount = asyncHandler(async (req, res) => {
  const account = await accountService.createChartAccount(req.body);
  res.status(201).json({ success: true, data: account, message: 'Chart account created' });
});

const deleteChartAccount = asyncHandler(async (req, res) => {
  await accountService.deleteChartAccount(req.params.id);
  res.json({ success: true, data: null, message: 'Chart account deleted' });
});

// Profit & Loss
const getProfitLoss = asyncHandler(async (req, res) => {
  const report = await accountService.getProfitLoss(req.query);
  res.json({ success: true, data: report, message: 'Profit & loss retrieved' });
});

module.exports = {
  getTransactions,
  createTransaction,
  deleteTransaction,
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getSummary,
  getExpenses,
  createExpense,
  deleteExpense,
  getIncomes,
  createIncome,
  deleteIncome,
  getChartOfAccounts,
  createChartAccount,
  deleteChartAccount,
  getProfitLoss,
};
