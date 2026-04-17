const express = require('express');
const router = express.Router();
const accountController = require('../controllers/account.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const { createTransactionSchema, createBankAccountSchema, updateBankAccountSchema, createExpenseSchema, createIncomeSchema, createChartAccountSchema } = require('../validators/account.validator');
const { uploadTransactionAttachments } = require('../middlewares/upload');

// All routes require authentication
router.use(protect);

// Transactions
router
  .route('/transactions')
  .get(authorize('accounts', 'view'), accountController.getTransactions)
  .post(authorize('accounts', 'create'), uploadTransactionAttachments, validate(createTransactionSchema), logActivity('accounts', 'Created transaction'), accountController.createTransaction);

router
  .route('/transactions/:id')
  .delete(authorize('accounts', 'delete'), logActivity('accounts', 'Deleted transaction'), accountController.deleteTransaction);

// Bank Accounts
router
  .route('/bank-accounts')
  .get(authorize('accounts', 'view'), accountController.getBankAccounts)
  .post(authorize('accounts', 'create'), validate(createBankAccountSchema), logActivity('accounts', 'Created bank account'), accountController.createBankAccount);

router
  .route('/bank-accounts/:id')
  .put(authorize('accounts', 'edit'), validate(updateBankAccountSchema), logActivity('accounts', 'Updated bank account'), accountController.updateBankAccount)
  .delete(authorize('accounts', 'delete'), logActivity('accounts', 'Deleted bank account'), accountController.deleteBankAccount);

// Summary
router.get('/summary', authorize('accounts', 'view'), accountController.getSummary);

// Expenses
router
  .route('/expenses')
  .get(authorize('accounts', 'view'), accountController.getExpenses)
  .post(authorize('accounts', 'create'), validate(createExpenseSchema), logActivity('accounts', 'Created expense'), accountController.createExpense);

router
  .route('/expenses/:id')
  .delete(authorize('accounts', 'delete'), logActivity('accounts', 'Deleted expense'), accountController.deleteExpense);

// Incomes
router
  .route('/incomes')
  .get(authorize('accounts', 'view'), accountController.getIncomes)
  .post(authorize('accounts', 'create'), validate(createIncomeSchema), logActivity('accounts', 'Created income'), accountController.createIncome);

router
  .route('/incomes/:id')
  .delete(authorize('accounts', 'delete'), logActivity('accounts', 'Deleted income'), accountController.deleteIncome);

// Chart of Accounts
router
  .route('/chart')
  .get(authorize('accounts', 'view'), accountController.getChartOfAccounts)
  .post(authorize('accounts', 'create'), validate(createChartAccountSchema), logActivity('accounts', 'Created chart account'), accountController.createChartAccount);

router
  .route('/chart/:id')
  .delete(authorize('accounts', 'delete'), logActivity('accounts', 'Deleted chart account'), accountController.deleteChartAccount);

// Profit & Loss
router.get('/profit-loss', authorize('accounts', 'view'), accountController.getProfitLoss);

module.exports = router;
