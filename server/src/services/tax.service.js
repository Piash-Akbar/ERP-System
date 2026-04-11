const Tax = require('../models/Tax');
const ApiError = require('../utils/apiError');

const getAll = async () => {
  return Tax.find({ isDeleted: false }).sort({ name: 1 }).lean();
};

const create = async (data) => {
  return Tax.create(data);
};

const update = async (id, data) => {
  const tax = await Tax.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true, runValidators: true }
  );
  if (!tax) throw new ApiError('Tax not found', 404);
  return tax;
};

const remove = async (id) => {
  const tax = await Tax.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!tax) throw new ApiError('Tax not found', 404);
  return tax;
};

module.exports = { getAll, create, update, remove };
