const router = require('express').Router();
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { validate } = require('../middlewares/validate');
const { logActivity } = require('../middlewares/activityLogger');
const {
  goodsReceivingSchema,
  goodsIssueSchema,
  warehouseTransferSchema,
  warehouseReturnSchema,
  stockCountSchema,
  scanCountItemSchema,
  reconciliationAdjustSchema,
  warehouseSettingsSchema,
} = require('../validators/warehouseOps.validator');
const ctrl = require('../controllers/warehouseOps.controller');

router.use(protect);

// ─── Dashboard ──────────────────────────────────────────────
router.get('/dashboard', authorize('warehouse', 'view'), ctrl.getDashboard);
router.get('/dashboard/stock-movement', authorize('warehouse', 'view'), ctrl.getStockMovementChart);
router.get('/dashboard/stock-by-category', authorize('warehouse', 'view'), ctrl.getStockByCategory);

// ─── Goods Receiving ────────────────────────────────────────
router.get('/receiving', authorize('warehouse', 'view'), ctrl.getReceivings);
router.get('/receiving/:id', authorize('warehouse', 'view'), ctrl.getReceivingById);
router.post(
  '/receiving',
  authorize('warehouse', 'create'),
  validate(goodsReceivingSchema),
  logActivity('warehouse', 'Created goods receiving'),
  ctrl.createReceiving
);
router.put(
  '/receiving/:id/complete',
  authorize('warehouse', 'edit'),
  logActivity('warehouse', 'Completed goods receiving'),
  ctrl.completeReceiving
);
router.put(
  '/receiving/:id/cancel',
  authorize('warehouse', 'edit'),
  logActivity('warehouse', 'Cancelled goods receiving'),
  ctrl.cancelReceiving
);

// ─── Goods Issue ────────────────────────────────────────────
router.get('/issue', authorize('warehouse', 'view'), ctrl.getIssues);
router.get('/issue/:id', authorize('warehouse', 'view'), ctrl.getIssueById);
router.post(
  '/issue',
  authorize('warehouse', 'create'),
  validate(goodsIssueSchema),
  logActivity('warehouse', 'Created goods issue'),
  ctrl.createIssue
);
router.put(
  '/issue/:id/complete',
  authorize('warehouse', 'edit'),
  logActivity('warehouse', 'Completed goods issue'),
  ctrl.completeIssue
);
router.put(
  '/issue/:id/cancel',
  authorize('warehouse', 'edit'),
  logActivity('warehouse', 'Cancelled goods issue'),
  ctrl.cancelIssue
);

// ─── Warehouse Transfer ─────────────────────────────────────
router.get('/transfer', authorize('warehouse', 'view'), ctrl.getTransfers);
router.get('/transfer/pending', authorize('warehouse', 'view'), ctrl.getPendingTransfers);
router.get('/transfer/:id', authorize('warehouse', 'view'), ctrl.getTransferById);
router.post(
  '/transfer',
  authorize('warehouse', 'create'),
  validate(warehouseTransferSchema),
  logActivity('warehouse', 'Created warehouse transfer'),
  ctrl.createTransfer
);
router.put(
  '/transfer/:id/complete',
  authorize('warehouse', 'edit'),
  logActivity('warehouse', 'Completed warehouse transfer'),
  ctrl.completeTransfer
);
router.put(
  '/transfer/:id/cancel',
  authorize('warehouse', 'edit'),
  logActivity('warehouse', 'Cancelled warehouse transfer'),
  ctrl.cancelTransfer
);

// ─── Stock Reconciliation ───────────────────────────────────
router.get('/reconciliation', authorize('warehouse', 'view'), ctrl.getReconciliation);
router.post(
  '/reconciliation/adjust',
  authorize('warehouse', 'create'),
  validate(reconciliationAdjustSchema),
  logActivity('warehouse', 'Applied reconciliation adjustments'),
  ctrl.applyReconciliation
);

// ─── Physical Stock Count ───────────────────────────────────
router.get('/stock-count', authorize('warehouse', 'view'), ctrl.getCountSessions);
router.get('/stock-count/:id', authorize('warehouse', 'view'), ctrl.getCountSessionById);
router.post(
  '/stock-count',
  authorize('warehouse', 'create'),
  validate(stockCountSchema),
  logActivity('warehouse', 'Created stock count session'),
  ctrl.createCountSession
);
router.put(
  '/stock-count/:id/start',
  authorize('warehouse', 'edit'),
  logActivity('warehouse', 'Started stock count session'),
  ctrl.startCountSession
);
router.put(
  '/stock-count/:id/scan',
  authorize('warehouse', 'edit'),
  validate(scanCountItemSchema),
  ctrl.scanCountItem
);
router.put(
  '/stock-count/:id/complete',
  authorize('warehouse', 'edit'),
  logActivity('warehouse', 'Completed stock count session'),
  ctrl.completeCountSession
);
router.put(
  '/stock-count/:id/reset',
  authorize('warehouse', 'edit'),
  logActivity('warehouse', 'Reset stock count session'),
  ctrl.resetCountSession
);

// ─── Warehouse Ledger ───────────────────────────────────────
router.get('/ledger', authorize('warehouse', 'view'), ctrl.getLedger);
router.get('/ledger/export', authorize('warehouse', 'view'), ctrl.exportLedgerCSV);

// ─── Warehouse Returns ──────────────────────────────────────
router.get('/returns', authorize('warehouse', 'view'), ctrl.getReturns);
router.get('/returns/:id', authorize('warehouse', 'view'), ctrl.getReturnById);
router.post(
  '/returns',
  authorize('warehouse', 'create'),
  validate(warehouseReturnSchema),
  logActivity('warehouse', 'Created warehouse return'),
  ctrl.createReturn
);
router.put(
  '/returns/:id/complete',
  authorize('warehouse', 'edit'),
  logActivity('warehouse', 'Completed warehouse return'),
  ctrl.completeReturn
);
router.put(
  '/returns/:id/cancel',
  authorize('warehouse', 'edit'),
  logActivity('warehouse', 'Cancelled warehouse return'),
  ctrl.cancelReturn
);

// ─── Settings ───────────────────────────────────────────────
router.get('/settings', authorize('warehouse', 'view'), ctrl.getWarehouseSettings);
router.put(
  '/settings',
  authorize('warehouse', 'edit'),
  validate(warehouseSettingsSchema),
  ctrl.updateWarehouseSettings
);

// ─── Barcode Scan ───────────────────────────────────────────
router.post('/scan', authorize('warehouse', 'view'), ctrl.scanBarcode);

module.exports = router;
