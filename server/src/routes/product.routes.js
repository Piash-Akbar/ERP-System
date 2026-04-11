const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { validate } = require('../middlewares/validate');
const { createProductSchema, updateProductSchema } = require('../validators/product.validator');
const { uploadProductImage } = require('../middlewares/upload');

router.use(protect);

router.get('/', authorize('products', 'read'), productController.getProducts);
router.get('/:id', authorize('products', 'read'), productController.getProduct);
router.post('/', authorize('products', 'create'), uploadProductImage, validate(createProductSchema), productController.createProduct);
router.put('/:id', authorize('products', 'update'), uploadProductImage, validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', authorize('products', 'delete'), productController.deleteProduct);

module.exports = router;
