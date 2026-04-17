const Asset = require('../models/Asset');
const AssetCategory = require('../models/AssetCategory');
const ApiError = require('../utils/apiError');
const { paginate } = require('../utils/pagination');

// ── Category CRUD ──

const getCategories = async (query = {}) => {
  const { page, limit, search } = query;
  const filter = { isDeleted: false };
  if (search) filter.name = { $regex: search, $options: 'i' };
  return paginate(AssetCategory, filter, { page, limit, sort: { name: 1 } });
};

const getCategoryById = async (id) => {
  const cat = await AssetCategory.findOne({ _id: id, isDeleted: false }).lean();
  if (!cat) throw new ApiError('Asset category not found', 404);
  return cat;
};

const createCategory = async (data) => {
  const existing = await AssetCategory.findOne({ name: data.name, isDeleted: false });
  if (existing) throw new ApiError('Category name already exists', 400);
  return AssetCategory.create(data);
};

const updateCategory = async (id, data) => {
  if (data.name) {
    const existing = await AssetCategory.findOne({ name: data.name, _id: { $ne: id }, isDeleted: false });
    if (existing) throw new ApiError('Category name already exists', 400);
  }
  const cat = await AssetCategory.findOneAndUpdate(
    { _id: id, isDeleted: false }, data, { new: true, runValidators: true }
  );
  if (!cat) throw new ApiError('Asset category not found', 404);
  return cat;
};

const deleteCategory = async (id) => {
  const assetCount = await Asset.countDocuments({ category: id, isDeleted: false });
  if (assetCount > 0) throw new ApiError('Cannot delete category with existing assets', 400);
  const cat = await AssetCategory.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true }, { new: true });
  if (!cat) throw new ApiError('Asset category not found', 404);
  return cat;
};

// ── Asset CRUD ──

const generateAssetCode = async () => {
  const last = await Asset.findOne().sort({ createdAt: -1 }).lean();
  if (!last || !last.assetCode) return 'AST-0001';
  const num = parseInt(last.assetCode.replace('AST-', '')) || 0;
  return `AST-${String(num + 1).padStart(4, '0')}`;
};

const getAll = async (query = {}) => {
  const { page, limit, search, category, status, branch, assignedTo } = query;
  const filter = { isDeleted: false };

  if (category) filter.category = category;
  if (status) filter.status = status;
  if (branch) filter.branch = branch;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [{ name: regex }, { assetCode: regex }, { serialNumber: regex }];
  }

  return paginate(Asset, filter, {
    page,
    limit,
    populate: [
      { path: 'category', select: 'name' },
      { path: 'location', select: 'name' },
      { path: 'assignedTo', select: 'name' },
      { path: 'branch', select: 'name' },
    ],
    sort: { createdAt: -1 },
  });
};

const getById = async (id) => {
  const asset = await Asset.findOne({ _id: id, isDeleted: false })
    .populate('category')
    .populate('location', 'name')
    .populate('warehouse', 'name')
    .populate('assignedTo', 'name email')
    .populate('supplier', 'name company')
    .populate('branch', 'name')
    .populate('createdBy', 'name')
    .populate('maintenanceHistory.performedBy', 'name')
    .populate('disposal.disposedBy', 'name')
    .lean();
  if (!asset) throw new ApiError('Asset not found', 404);
  return asset;
};

const create = async (data, userId) => {
  data.assetCode = await generateAssetCode();
  data.currentValue = data.purchasePrice;
  data.createdBy = userId;

  const asset = await Asset.create(data);
  return Asset.findById(asset._id)
    .populate('category', 'name')
    .populate('branch', 'name')
    .lean();
};

const update = async (id, data) => {
  const asset = await Asset.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true, runValidators: true }
  )
    .populate('category', 'name')
    .populate('branch', 'name');
  if (!asset) throw new ApiError('Asset not found', 404);
  return asset;
};

const assign = async (id, assignedTo) => {
  const asset = await Asset.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { assignedTo },
    { new: true }
  ).populate('assignedTo', 'name email');
  if (!asset) throw new ApiError('Asset not found', 404);
  return asset;
};

const transfer = async (id, data) => {
  const updateData = {};
  if (data.location) updateData.location = data.location;
  if (data.warehouse) updateData.warehouse = data.warehouse;
  if (data.branch) updateData.branch = data.branch;
  updateData.status = 'transferred';

  const asset = await Asset.findOneAndUpdate(
    { _id: id, isDeleted: false },
    updateData,
    { new: true }
  )
    .populate('location', 'name')
    .populate('branch', 'name');
  if (!asset) throw new ApiError('Asset not found', 404);

  // Reset status to active after transfer
  asset.status = 'active';
  await asset.save();

  return asset;
};

const addMaintenance = async (id, data) => {
  const asset = await Asset.findOne({ _id: id, isDeleted: false });
  if (!asset) throw new ApiError('Asset not found', 404);

  asset.maintenanceHistory.push(data);
  asset.status = 'in_maintenance';
  await asset.save();

  return asset;
};

const dispose = async (id, data, userId) => {
  const asset = await Asset.findOne({ _id: id, isDeleted: false });
  if (!asset) throw new ApiError('Asset not found', 404);
  if (asset.status === 'disposed') throw new ApiError('Asset already disposed', 400);

  asset.disposal = {
    date: new Date(),
    method: data.method,
    saleAmount: data.saleAmount || 0,
    reason: data.reason || '',
    disposedBy: userId,
  };
  asset.status = 'disposed';
  await asset.save();

  return asset;
};

const runDepreciation = async () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const assets = await Asset.find({
    isDeleted: false,
    status: 'active',
    depreciationMethod: { $ne: 'none' },
    $or: [
      { lastDepreciationDate: { $lt: monthStart } },
      { lastDepreciationDate: null },
    ],
  });

  let processed = 0;

  for (const asset of assets) {
    let depAmount = 0;

    if (asset.depreciationMethod === 'straight_line') {
      depAmount = (asset.purchasePrice - asset.salvageValue) / asset.usefulLife;
    } else if (asset.depreciationMethod === 'declining_balance') {
      const annualRate = asset.depreciationRate || 20;
      depAmount = (asset.currentValue * annualRate / 100) / 12;
    }

    if (depAmount <= 0) continue;

    const newValue = Math.max(asset.salvageValue, asset.currentValue - depAmount);
    const actualDep = asset.currentValue - newValue;

    if (actualDep <= 0) continue;

    asset.currentValue = newValue;
    asset.accumulatedDepreciation += actualDep;
    asset.lastDepreciationDate = now;
    asset.depreciationSchedule.push({
      date: now,
      amount: actualDep,
      bookValue: newValue,
    });

    await asset.save();
    processed++;
  }

  return { processed, message: `Depreciation run completed for ${processed} assets` };
};

const remove = async (id) => {
  const asset = await Asset.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!asset) throw new ApiError('Asset not found', 404);
  return asset;
};

const getSummary = async () => {
  const [totalAssets, activeAssets, disposedAssets, inMaintenance] = await Promise.all([
    Asset.countDocuments({ isDeleted: false }),
    Asset.countDocuments({ isDeleted: false, status: 'active' }),
    Asset.countDocuments({ isDeleted: false, status: 'disposed' }),
    Asset.countDocuments({ isDeleted: false, status: 'in_maintenance' }),
  ]);

  const valueAgg = await Asset.aggregate([
    { $match: { isDeleted: false, status: { $ne: 'disposed' } } },
    {
      $group: {
        _id: null,
        totalPurchaseValue: { $sum: '$purchasePrice' },
        totalCurrentValue: { $sum: '$currentValue' },
        totalDepreciation: { $sum: '$accumulatedDepreciation' },
      },
    },
  ]);

  const values = valueAgg[0] || { totalPurchaseValue: 0, totalCurrentValue: 0, totalDepreciation: 0 };

  return {
    totalAssets,
    activeAssets,
    disposedAssets,
    inMaintenance,
    ...values,
  };
};

module.exports = {
  getCategories, getCategoryById, createCategory, updateCategory, deleteCategory,
  getAll, getById, create, update, assign, transfer, addMaintenance, dispose, runDepreciation, remove, getSummary,
};
