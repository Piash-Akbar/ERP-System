const asyncHandler = require('../utils/asyncHandler');
const barcodeService = require('../services/barcode.service');

const generate = asyncHandler(async (req, res) => {
  const result = await barcodeService.generate(req.body, req.user._id);
  res.status(201).json({ success: true, data: result, message: 'Barcode generated' });
});

const generateBulk = asyncHandler(async (req, res) => {
  const results = await barcodeService.generateBulk(req.body, req.user._id);
  res.status(201).json({ success: true, data: results, message: 'Bulk generation completed' });
});

const lookup = asyncHandler(async (req, res) => {
  const result = await barcodeService.lookup(req.params.code);
  res.json({ success: true, data: result, message: result.found ? 'Product found' : 'No product found' });
});

const checkDuplicate = asyncHandler(async (req, res) => {
  const result = await barcodeService.checkDuplicate(req.query.barcode);
  res.json({ success: true, data: result });
});

const assign = asyncHandler(async (req, res) => {
  const product = await barcodeService.assign(req.body, req.user._id);
  res.json({ success: true, data: product, message: 'Barcode assigned' });
});

const getPrintData = asyncHandler(async (req, res) => {
  const ids = req.query.productIds ? req.query.productIds.split(',') : [];
  const data = await barcodeService.getPrintData(ids);
  res.json({ success: true, data, message: 'Print data retrieved' });
});

const logPrint = asyncHandler(async (req, res) => {
  const result = await barcodeService.logPrint(req.body.barcodes);
  res.json({ success: true, data: result, message: 'Print logged' });
});

const getUnassigned = asyncHandler(async (req, res) => {
  const result = await barcodeService.getUnassigned(req.query);
  res.json({ success: true, data: result, message: 'Unassigned products retrieved' });
});

const getAll = asyncHandler(async (req, res) => {
  const result = await barcodeService.getAll(req.query);
  res.json({ success: true, data: result, message: 'Barcode logs retrieved' });
});

const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await barcodeService.getDashboardStats();
  res.json({ success: true, data: stats, message: 'Stats retrieved' });
});

module.exports = {
  generate, generateBulk, lookup, checkDuplicate, assign,
  getPrintData, logPrint, getUnassigned, getAll, getDashboardStats,
};
