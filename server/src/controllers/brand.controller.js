const asyncHandler = require('../utils/asyncHandler');
const brandService = require('../services/brand.service');

const getBrands = asyncHandler(async (req, res) => {
  const brands = await brandService.getAll();
  res.json({ success: true, data: brands, message: 'Brands retrieved' });
});

const createBrand = asyncHandler(async (req, res) => {
  const brand = await brandService.create(req.body);
  res.status(201).json({ success: true, data: brand, message: 'Brand created' });
});

const updateBrand = asyncHandler(async (req, res) => {
  const brand = await brandService.update(req.params.id, req.body);
  res.json({ success: true, data: brand, message: 'Brand updated' });
});

const deleteBrand = asyncHandler(async (req, res) => {
  await brandService.remove(req.params.id);
  res.json({ success: true, data: null, message: 'Brand deleted' });
});

module.exports = { getBrands, createBrand, updateBrand, deleteBrand };
