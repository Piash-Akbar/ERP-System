const asyncHandler = require('../utils/asyncHandler');
const categoryService = require('../services/category.service');

const getCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getAll();
  res.json({ success: true, data: categories, message: 'Categories retrieved' });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.create(req.body);
  res.status(201).json({ success: true, data: category, message: 'Category created' });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.update(req.params.id, req.body);
  res.json({ success: true, data: category, message: 'Category updated' });
});

const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.remove(req.params.id);
  res.json({ success: true, data: null, message: 'Category deleted' });
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
