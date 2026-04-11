const asyncHandler = require('../utils/asyncHandler');
const inventoryService = require('../services/inventory.service');

const getStockList = asyncHandler(async (req, res) => {
  const result = await inventoryService.getStockList(req.query);
  res.json({ success: true, data: result, message: 'Stock list retrieved' });
});

const getLowStock = asyncHandler(async (req, res) => {
  const result = await inventoryService.getLowStock();
  res.json({ success: true, data: result, message: 'Low stock items retrieved' });
});

const adjustStock = asyncHandler(async (req, res) => {
  const result = await inventoryService.adjustStock(req.body, req.user._id);
  res.status(201).json({ success: true, data: result, message: 'Stock adjusted successfully' });
});

const transferStock = asyncHandler(async (req, res) => {
  const result = await inventoryService.transferStock(req.body, req.user._id);
  res.status(201).json({ success: true, data: result, message: 'Stock transferred successfully' });
});

const getAdjustments = asyncHandler(async (req, res) => {
  const result = await inventoryService.getAdjustments(req.query);
  res.json({ success: true, data: result, message: 'Adjustments retrieved' });
});

const getTransfers = asyncHandler(async (req, res) => {
  const result = await inventoryService.getTransfers(req.query);
  res.json({ success: true, data: result, message: 'Transfers retrieved' });
});

const getAdjustmentById = asyncHandler(async (req, res) => {
  const result = await inventoryService.getAdjustmentById(req.params.id);
  res.json({ success: true, data: result, message: 'Adjustment retrieved' });
});

const getTransferById = asyncHandler(async (req, res) => {
  const result = await inventoryService.getTransferById(req.params.id);
  res.json({ success: true, data: result, message: 'Transfer retrieved' });
});

module.exports = {
  getStockList,
  getLowStock,
  adjustStock,
  transferStock,
  getAdjustments,
  getAdjustmentById,
  getTransfers,
  getTransferById,
};
