const Warehouse = require('../models/Warehouse');
const ApiError = require('../utils/apiError');

const getAll = async (query = {}) => {
  const filter = { isDeleted: false };

  if (query.branchId) {
    filter.branch = query.branchId;
  }

  const warehouses = await Warehouse.find(filter)
    .populate('branch', 'name code')
    .sort({ name: 1 });

  return warehouses;
};

const getById = async (id) => {
  const warehouse = await Warehouse.findOne({ _id: id, isDeleted: false })
    .populate('branch', 'name code');

  if (!warehouse) {
    throw new ApiError('Warehouse not found', 404);
  }

  return warehouse;
};

const create = async (data) => {
  const existing = await Warehouse.findOne({ code: data.code.toUpperCase(), isDeleted: false });
  if (existing) {
    throw new ApiError('Warehouse code already exists', 400);
  }

  const warehouse = await Warehouse.create(data);
  return warehouse.populate('branch', 'name code');
};

const update = async (id, data) => {
  if (data.code) {
    const existing = await Warehouse.findOne({
      code: data.code.toUpperCase(),
      _id: { $ne: id },
      isDeleted: false,
    });
    if (existing) {
      throw new ApiError('Warehouse code already exists', 400);
    }
  }

  const warehouse = await Warehouse.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true, runValidators: true }
  ).populate('branch', 'name code');

  if (!warehouse) {
    throw new ApiError('Warehouse not found', 404);
  }

  return warehouse;
};

const remove = async (id) => {
  const warehouse = await Warehouse.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );

  if (!warehouse) {
    throw new ApiError('Warehouse not found', 404);
  }

  return warehouse;
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: remove,
};
