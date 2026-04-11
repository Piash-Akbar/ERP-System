const asyncHandler = require('../utils/asyncHandler');
const productService = require('../services/product.service');
const { deleteFiles } = require('../middlewares/upload');

const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.getAll(req.query);
  res.json({ success: true, data: result, message: 'Products retrieved' });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getById(req.params.id);
  res.json({ success: true, data: product, message: 'Product retrieved' });
});

const createProduct = asyncHandler(async (req, res) => {
  if (req.file) {
    req.body.image = `/uploads/${req.file.filename}`;
  }
  const product = await productService.create(req.body);
  res.status(201).json({ success: true, data: product, message: 'Product created' });
});

const updateProduct = asyncHandler(async (req, res) => {
  // If a new image is uploaded, delete the old one
  if (req.file) {
    const existing = await productService.getById(req.params.id);
    if (existing.image) {
      deleteFiles([existing.image]);
    }
    req.body.image = `/uploads/${req.file.filename}`;
  }
  const product = await productService.update(req.params.id, req.body);
  res.json({ success: true, data: product, message: 'Product updated' });
});

const deleteProduct = asyncHandler(async (req, res) => {
  await productService.remove(req.params.id);
  res.json({ success: true, data: null, message: 'Product deleted' });
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
