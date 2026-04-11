const express = require('express');
const router = express.Router();
const accountController = require('../controllers/account.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const { createTransactionSchema, createBankAccountSchema, updateBankAccountSchema } = require('../validators/account.validator');
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

module.exports = router;
