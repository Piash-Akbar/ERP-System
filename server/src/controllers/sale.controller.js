const asyncHandler = require('../utils/asyncHandler');
const saleService = require('../services/sale.service');

exports.getSales = asyncHandler(async (req, res) => {
  const result = await saleService.getAll(req.query);
  res.json({ success: true, data: result, message: 'Sales retrieved' });
});

exports.getSale = asyncHandler(async (req, res) => {
  const sale = await saleService.getById(req.params.id);
  res.json({ success: true, data: sale, message: 'Sale retrieved' });
});

exports.createSale = asyncHandler(async (req, res) => {
  const sale = await saleService.create(req.body, req.user._id);
  res.status(201).json({ success: true, data: sale, message: 'Sale created' });
});

exports.addPayment = asyncHandler(async (req, res) => {
  const sale = await saleService.addPayment(req.params.id, req.body);
  res.json({ success: true, data: sale, message: 'Payment added' });
});

exports.createReturn = asyncHandler(async (req, res) => {
  const returnSale = await saleService.createReturn(req.params.id, req.body.items, req.user._id);
  res.status(201).json({ success: true, data: returnSale, message: 'Return created' });
});

exports.updateSaleStatus = asyncHandler(async (req, res) => {
  const Sale = require('../models/Sale');
  const sale = await Sale.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { status: req.body.status },
    { new: true, runValidators: true }
  ).populate('customer');
  if (!sale) { const err = new Error('Sale not found'); err.statusCode = 404; throw err; }
  res.json({ success: true, data: sale, message: 'Sale status updated' });
});

exports.deleteSale = asyncHandler(async (req, res) => {
  await saleService.deleteSale(req.params.id);
  res.json({ success: true, data: null, message: 'Sale deleted' });
});
