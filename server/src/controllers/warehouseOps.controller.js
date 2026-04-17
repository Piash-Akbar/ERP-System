const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/warehouseOps.service');

// Dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const data = await service.getDashboard(req.query.warehouse);
  res.json({ success: true, data });
});

const getStockMovementChart = asyncHandler(async (req, res) => {
  const data = await service.getStockMovementChart(req.query.warehouse, parseInt(req.query.days) || 7);
  res.json({ success: true, data });
});

const getStockByCategory = asyncHandler(async (req, res) => {
  const data = await service.getStockByCategory(req.query.warehouse);
  res.json({ success: true, data });
});

// Goods Receiving
const getReceivings = asyncHandler(async (req, res) => {
  const data = await service.getReceivings(req.query);
  res.json({ success: true, ...data });
});

const getReceivingById = asyncHandler(async (req, res) => {
  const data = await service.getReceivingById(req.params.id);
  res.json({ success: true, data });
});

const createReceiving = asyncHandler(async (req, res) => {
  const data = await service.createReceiving(req.body, req.user._id);
  res.status(201).json({ success: true, data, message: 'Goods receiving created' });
});

const completeReceiving = asyncHandler(async (req, res) => {
  const data = await service.completeReceiving(req.params.id, req.user._id);
  res.json({ success: true, data, message: 'Goods receiving completed' });
});

const cancelReceiving = asyncHandler(async (req, res) => {
  const data = await service.cancelReceiving(req.params.id);
  res.json({ success: true, data, message: 'Goods receiving cancelled' });
});

// Goods Issue
const getIssues = asyncHandler(async (req, res) => {
  const data = await service.getIssues(req.query);
  res.json({ success: true, ...data });
});

const getIssueById = asyncHandler(async (req, res) => {
  const data = await service.getIssueById(req.params.id);
  res.json({ success: true, data });
});

const createIssue = asyncHandler(async (req, res) => {
  const data = await service.createIssue(req.body, req.user._id);
  res.status(201).json({ success: true, data, message: 'Goods issue created' });
});

const completeIssue = asyncHandler(async (req, res) => {
  const data = await service.completeIssue(req.params.id, req.user._id);
  res.json({ success: true, data, message: 'Goods issue completed' });
});

const cancelIssue = asyncHandler(async (req, res) => {
  const data = await service.cancelIssue(req.params.id);
  res.json({ success: true, data, message: 'Goods issue cancelled' });
});

// Warehouse Transfer
const getTransfers = asyncHandler(async (req, res) => {
  const data = await service.getTransfers(req.query);
  res.json({ success: true, ...data });
});

const getPendingTransfers = asyncHandler(async (req, res) => {
  const data = await service.getPendingTransfers(req.query);
  res.json({ success: true, ...data });
});

const getTransferById = asyncHandler(async (req, res) => {
  const data = await service.getTransferById(req.params.id);
  res.json({ success: true, data });
});

const createTransfer = asyncHandler(async (req, res) => {
  const data = await service.createTransfer(req.body, req.user._id);
  res.status(201).json({ success: true, data, message: 'Transfer created' });
});

const completeTransfer = asyncHandler(async (req, res) => {
  const data = await service.completeTransfer(req.params.id, req.user._id);
  res.json({ success: true, data, message: 'Transfer completed' });
});

const cancelTransfer = asyncHandler(async (req, res) => {
  const data = await service.cancelTransfer(req.params.id);
  res.json({ success: true, data, message: 'Transfer cancelled' });
});

// Stock Reconciliation
const getReconciliation = asyncHandler(async (req, res) => {
  const data = await service.getReconciliation(req.query.warehouse, req.query);
  res.json({ success: true, data });
});

const applyReconciliation = asyncHandler(async (req, res) => {
  const data = await service.applyReconciliationAdjustments(req.body, req.user._id);
  res.json({ success: true, data, message: 'Reconciliation adjustments applied' });
});

// Physical Stock Count
const getCountSessions = asyncHandler(async (req, res) => {
  const data = await service.getCountSessions(req.query);
  res.json({ success: true, ...data });
});

const getCountSessionById = asyncHandler(async (req, res) => {
  const data = await service.getCountSessionById(req.params.id);
  res.json({ success: true, data });
});

const createCountSession = asyncHandler(async (req, res) => {
  const data = await service.createCountSession(req.body, req.user._id);
  res.status(201).json({ success: true, data, message: 'Count session created' });
});

const startCountSession = asyncHandler(async (req, res) => {
  const data = await service.startCountSession(req.params.id);
  res.json({ success: true, data, message: 'Count session started' });
});

const scanCountItem = asyncHandler(async (req, res) => {
  const data = await service.scanCountItem(req.params.id, req.body);
  res.json({ success: true, data, message: 'Item scanned' });
});

const completeCountSession = asyncHandler(async (req, res) => {
  const data = await service.completeCountSession(req.params.id, req.user._id);
  res.json({ success: true, data, message: 'Count session completed' });
});

const resetCountSession = asyncHandler(async (req, res) => {
  const data = await service.resetCountSession(req.params.id);
  res.json({ success: true, data, message: 'Count session reset' });
});

// Warehouse Ledger
const getLedger = asyncHandler(async (req, res) => {
  const [ledger, summary] = await Promise.all([
    service.getLedger(req.query),
    service.getLedgerSummary(req.query),
  ]);
  res.json({ success: true, ...ledger, summary });
});

const exportLedgerCSV = asyncHandler(async (req, res) => {
  const csv = await service.exportLedgerCSV(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=warehouse-ledger.csv');
  res.send(csv);
});

// Warehouse Returns
const getReturns = asyncHandler(async (req, res) => {
  const data = await service.getReturns(req.query);
  res.json({ success: true, ...data });
});

const getReturnById = asyncHandler(async (req, res) => {
  const data = await service.getReturnById(req.params.id);
  res.json({ success: true, data });
});

const createReturn = asyncHandler(async (req, res) => {
  const data = await service.createReturn(req.body, req.user._id);
  res.status(201).json({ success: true, data, message: 'Warehouse return created' });
});

const completeReturn = asyncHandler(async (req, res) => {
  const data = await service.completeReturn(req.params.id, req.user._id);
  res.json({ success: true, data, message: 'Warehouse return completed' });
});

const cancelReturn = asyncHandler(async (req, res) => {
  const data = await service.cancelReturn(req.params.id);
  res.json({ success: true, data, message: 'Warehouse return cancelled' });
});

// Settings
const getWarehouseSettings = asyncHandler(async (req, res) => {
  const data = await service.getWarehouseSettings(req.user._id, req.query.warehouse);
  res.json({ success: true, data });
});

const updateWarehouseSettings = asyncHandler(async (req, res) => {
  const data = await service.updateWarehouseSettings(req.user._id, req.body);
  res.json({ success: true, data, message: 'Settings updated' });
});

// Barcode Scan
const scanBarcode = asyncHandler(async (req, res) => {
  const data = await service.scanBarcode(req.body.barcode);
  res.json({ success: true, data });
});

module.exports = {
  getDashboard,
  getStockMovementChart,
  getStockByCategory,
  getReceivings,
  getReceivingById,
  createReceiving,
  completeReceiving,
  cancelReceiving,
  getIssues,
  getIssueById,
  createIssue,
  completeIssue,
  cancelIssue,
  getTransfers,
  getPendingTransfers,
  getTransferById,
  createTransfer,
  completeTransfer,
  cancelTransfer,
  getReconciliation,
  applyReconciliation,
  getCountSessions,
  getCountSessionById,
  createCountSession,
  startCountSession,
  scanCountItem,
  completeCountSession,
  resetCountSession,
  getLedger,
  exportLedgerCSV,
  getReturns,
  getReturnById,
  createReturn,
  completeReturn,
  cancelReturn,
  getWarehouseSettings,
  updateWarehouseSettings,
  scanBarcode,
};
