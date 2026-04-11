const asyncHandler = require('../utils/asyncHandler');
const taxService = require('../services/tax.service');

const getTaxes = asyncHandler(async (req, res) => {
  const taxes = await taxService.getAll();
  res.json({ success: true, data: taxes, message: 'Taxes retrieved' });
});

const createTax = asyncHandler(async (req, res) => {
  const tax = await taxService.create(req.body);
  res.status(201).json({ success: true, data: tax, message: 'Tax created' });
});

const updateTax = asyncHandler(async (req, res) => {
  const tax = await taxService.update(req.params.id, req.body);
  res.json({ success: true, data: tax, message: 'Tax updated' });
});

const deleteTax = asyncHandler(async (req, res) => {
  await taxService.remove(req.params.id);
  res.json({ success: true, data: null, message: 'Tax deleted' });
});

module.exports = { getTaxes, createTax, updateTax, deleteTax };
