const asyncHandler = require('../utils/asyncHandler');
const assetService = require('../services/asset.service');

// Categories
const getCategories = asyncHandler(async (req, res) => {
  const result = await assetService.getCategories(req.query);
  res.json({ success: true, data: result, message: 'Asset categories retrieved' });
});

const getCategory = asyncHandler(async (req, res) => {
  const cat = await assetService.getCategoryById(req.params.id);
  res.json({ success: true, data: cat, message: 'Category retrieved' });
});

const createCategory = asyncHandler(async (req, res) => {
  const cat = await assetService.createCategory(req.body);
  res.status(201).json({ success: true, data: cat, message: 'Category created' });
});

const updateCategory = asyncHandler(async (req, res) => {
  const cat = await assetService.updateCategory(req.params.id, req.body);
  res.json({ success: true, data: cat, message: 'Category updated' });
});

const deleteCategory = asyncHandler(async (req, res) => {
  await assetService.deleteCategory(req.params.id);
  res.json({ success: true, data: null, message: 'Category deleted' });
});

// Assets
const getAssets = asyncHandler(async (req, res) => {
  const result = await assetService.getAll(req.query);
  res.json({ success: true, data: result, message: 'Assets retrieved' });
});

const getAsset = asyncHandler(async (req, res) => {
  const asset = await assetService.getById(req.params.id);
  res.json({ success: true, data: asset, message: 'Asset retrieved' });
});

const createAsset = asyncHandler(async (req, res) => {
  const asset = await assetService.create(req.body, req.user._id);
  res.status(201).json({ success: true, data: asset, message: 'Asset registered' });
});

const updateAsset = asyncHandler(async (req, res) => {
  const asset = await assetService.update(req.params.id, req.body);
  res.json({ success: true, data: asset, message: 'Asset updated' });
});

const assignAsset = asyncHandler(async (req, res) => {
  const asset = await assetService.assign(req.params.id, req.body.assignedTo);
  res.json({ success: true, data: asset, message: 'Asset assigned' });
});

const transferAsset = asyncHandler(async (req, res) => {
  const asset = await assetService.transfer(req.params.id, req.body);
  res.json({ success: true, data: asset, message: 'Asset transferred' });
});

const addMaintenance = asyncHandler(async (req, res) => {
  const asset = await assetService.addMaintenance(req.params.id, req.body);
  res.json({ success: true, data: asset, message: 'Maintenance record added' });
});

const disposeAsset = asyncHandler(async (req, res) => {
  const asset = await assetService.dispose(req.params.id, req.body, req.user._id);
  res.json({ success: true, data: asset, message: 'Asset disposed' });
});

const runDepreciation = asyncHandler(async (req, res) => {
  const result = await assetService.runDepreciation();
  res.json({ success: true, data: result, message: result.message });
});

const deleteAsset = asyncHandler(async (req, res) => {
  await assetService.remove(req.params.id);
  res.json({ success: true, data: null, message: 'Asset deleted' });
});

const getAssetSummary = asyncHandler(async (req, res) => {
  const summary = await assetService.getSummary();
  res.json({ success: true, data: summary, message: 'Asset summary retrieved' });
});

module.exports = {
  getCategories, getCategory, createCategory, updateCategory, deleteCategory,
  getAssets, getAsset, createAsset, updateAsset, assignAsset, transferAsset,
  addMaintenance, disposeAsset, runDepreciation, deleteAsset, getAssetSummary,
};
