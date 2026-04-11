const branchService = require('../services/branch.service');
const asyncHandler = require('../utils/asyncHandler');

const getBranches = asyncHandler(async (req, res) => {
  const branches = await branchService.getAll();
  res.json({ success: true, data: branches, message: 'Branches retrieved' });
});

const getBranch = asyncHandler(async (req, res) => {
  const branch = await branchService.getById(req.params.id);
  res.json({ success: true, data: branch, message: 'Branch retrieved' });
});

const createBranch = asyncHandler(async (req, res) => {
  const branch = await branchService.create(req.body);
  res.status(201).json({ success: true, data: branch, message: 'Branch created' });
});

const updateBranch = asyncHandler(async (req, res) => {
  const branch = await branchService.update(req.params.id, req.body);
  res.json({ success: true, data: branch, message: 'Branch updated' });
});

const deleteBranch = asyncHandler(async (req, res) => {
  await branchService.delete(req.params.id);
  res.json({ success: true, data: null, message: 'Branch deleted' });
});

module.exports = {
  getBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch,
};
