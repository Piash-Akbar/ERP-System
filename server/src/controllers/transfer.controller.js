const asyncHandler = require('../utils/asyncHandler');
const transferService = require('../services/transfer.service');

exports.getMoneyTransfers = asyncHandler(async (req, res) => {
  const result = await transferService.getMoneyTransfers(req.query);
  res.json({ success: true, data: result, message: 'Transfers retrieved' });
});

exports.createMoneyTransfer = asyncHandler(async (req, res) => {
  const transfer = await transferService.createMoneyTransfer(req.body, req.user._id);
  res.status(201).json({ success: true, data: transfer, message: 'Transfer created' });
});

exports.deleteMoneyTransfer = asyncHandler(async (req, res) => {
  await transferService.deleteMoneyTransfer(req.params.id);
  res.json({ success: true, data: null, message: 'Transfer deleted' });
});
