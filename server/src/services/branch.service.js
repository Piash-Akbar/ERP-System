const Branch = require('../models/Branch');
const ApiError = require('../utils/apiError');

const getAll = async () => {
  const branches = await Branch.find({ isDeleted: false }).sort({ name: 1 });
  return branches;
};

const getById = async (id) => {
  const branch = await Branch.findOne({ _id: id, isDeleted: false });
  if (!branch) {
    throw new ApiError('Branch not found', 404);
  }
  return branch;
};

const create = async (data) => {
  const existing = await Branch.findOne({ code: data.code.toUpperCase(), isDeleted: false });
  if (existing) {
    throw new ApiError('Branch code already exists', 400);
  }
  const branch = await Branch.create(data);
  return branch;
};

const update = async (id, data) => {
  if (data.code) {
    const existing = await Branch.findOne({
      code: data.code.toUpperCase(),
      _id: { $ne: id },
      isDeleted: false,
    });
    if (existing) {
      throw new ApiError('Branch code already exists', 400);
    }
  }

  const branch = await Branch.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true, runValidators: true }
  );

  if (!branch) {
    throw new ApiError('Branch not found', 404);
  }

  return branch;
};

const remove = async (id) => {
  const branch = await Branch.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );

  if (!branch) {
    throw new ApiError('Branch not found', 404);
  }

  return branch;
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: remove,
};
