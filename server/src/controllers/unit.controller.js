const asyncHandler = require('../utils/asyncHandler');
const unitService = require('../services/unit.service');

const getUnits = asyncHandler(async (req, res) => {
  const units = await unitService.getAll();
  res.json({ success: true, data: units, message: 'Units retrieved' });
});

const createUnit = asyncHandler(async (req, res) => {
  const unit = await unitService.create(req.body);
  res.status(201).json({ success: true, data: unit, message: 'Unit created' });
});

const updateUnit = asyncHandler(async (req, res) => {
  const unit = await unitService.update(req.params.id, req.body);
  res.json({ success: true, data: unit, message: 'Unit updated' });
});

const deleteUnit = asyncHandler(async (req, res) => {
  await unitService.remove(req.params.id);
  res.json({ success: true, data: null, message: 'Unit deleted' });
});

module.exports = { getUnits, createUnit, updateUnit, deleteUnit };
