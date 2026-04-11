const Category = require('../models/Category');
const ApiError = require('../utils/apiError');

const getAll = async () => {
  return Category.find({ isDeleted: false }).populate('parent', 'name slug').sort({ name: 1 }).lean();
};

const create = async (data) => {
  if (!data.slug && data.name) {
    data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  return Category.create(data);
};

const update = async (id, data) => {
  if (data.name && !data.slug) {
    data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  const category = await Category.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true, runValidators: true }
  );
  if (!category) throw new ApiError('Category not found', 404);
  return category;
};

const remove = async (id) => {
  const category = await Category.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!category) throw new ApiError('Category not found', 404);
  return category;
};

module.exports = { getAll, create, update, remove };
