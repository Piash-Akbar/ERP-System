const Product = require('../models/Product');
const ApiError = require('../utils/apiError');
const { paginate } = require('../utils/pagination');

const populateFields = [
  { path: 'category', select: 'name slug' },
  { path: 'brand', select: 'name' },
  { path: 'unit', select: 'name shortName' },
  { path: 'tax', select: 'name rate' },
];

const getAll = async (query) => {
  const filter = { isDeleted: false };

  if (query.search) {
    const regex = new RegExp(query.search, 'i');
    filter.$or = [{ name: regex }, { sku: regex }];
  }

  if (query.category) filter.category = query.category;
  if (query.brand) filter.brand = query.brand;
  if (query.type) filter.type = query.type;

  const result = await paginate(Product, filter, {
    page: query.page,
    limit: query.limit,
    sort: query.sort || { createdAt: -1 },
    populate: populateFields,
  });

  return result;
};

const getById = async (id) => {
  const product = await Product.findOne({ _id: id, isDeleted: false }).populate(populateFields);

  if (!product) {
    throw new ApiError('Product not found', 404);
  }

  return product;
};

const create = async (data) => {
  const existing = await Product.findOne({ sku: data.sku, isDeleted: false });
  if (existing) {
    throw new ApiError('A product with this SKU already exists', 400);
  }

  const product = await Product.create(data);
  return product.populate(populateFields);
};

const update = async (id, data) => {
  if (data.sku) {
    const existing = await Product.findOne({ sku: data.sku, isDeleted: false, _id: { $ne: id } });
    if (existing) {
      throw new ApiError('A product with this SKU already exists', 400);
    }
  }

  const product = await Product.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true, runValidators: true }
  ).populate(populateFields);

  if (!product) {
    throw new ApiError('Product not found', 404);
  }

  return product;
};

const remove = async (id) => {
  const product = await Product.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );

  if (!product) {
    throw new ApiError('Product not found', 404);
  }

  return product;
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
