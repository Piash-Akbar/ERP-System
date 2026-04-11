const Brand = require('../models/Brand');
const ApiError = require('../utils/apiError');

const getAll = async () => {
  return Brand.find({ isDeleted: false }).sort({ name: 1 }).lean();
};

const create = async (data) => {
  return Brand.create(data);
};

const update = async (id, data) => {
  const brand = await Brand.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true, runValidators: true }
  );
  if (!brand) throw new ApiError('Brand not found', 404);
  return brand;
};

const remove = async (id) => {
  const brand = await Brand.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!brand) throw new ApiError('Brand not found', 404);
  return brand;
};

module.exports = { getAll, create, update, remove };
