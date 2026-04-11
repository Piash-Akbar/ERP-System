const express = require('express');
const router = express.Router();
const accountController = require('../controllers/account.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { uploadTransactionAttachments } = require('../middlewares/upload');

// All routes require authentication
router.use(protect);

// Transactions
router
  .route('/transactions')
  .get(authorize('accounts', 'view'), accountController.getTransactions)
  .post(authorize('accounts', 'create'), uploadTransactionAttachments, accountController.createTransaction);

router
  .route('/transactions/:id')
  .delete(authorize('accounts', 'delete'), accountController.deleteTransaction);

// Bank Accounts
router
  .route('/bank-accounts')
  .get(authorize('accounts', 'view'), accountController.getBankAccounts)
  .post(authorize('accounts', 'create'), accountController.createBankAccount);

router
  .route('/bank-accounts/:id')
  .put(authorize('accounts', 'edit'), accountController.updateBankAccount)
  .delete(authorize('accounts', 'delete'), accountController.deleteBankAccount);

// Summary
router.get('/summary', authorize('accounts', 'view'), accountController.getSummary);

module.exports = router;
