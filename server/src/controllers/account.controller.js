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

module.exports = {
  getTransactions,
  createTransaction,
  deleteTransaction,
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getSummary,
};
