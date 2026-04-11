const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const { createProductSchema, updateProductSchema } = require('../validators/product.validator');
const { uploadProductImage } = require('../middlewares/upload');

router.use(protect);

router.get('/', authorize('products', 'view'), productController.getProducts);
router.get('/:id', authorize('products', 'view'), productController.getProduct);
router.post('/', authorize('products', 'create'), uploadProductImage, validate(createProductSchema), logActivity('products', 'Created product'), productController.createProduct);
router.put('/:id', authorize('products', 'edit'), uploadProductImage, validate(updateProductSchema), logActivity('products', 'Updated product'), productController.updateProduct);
router.delete('/:id', authorize('products', 'delete'), logActivity('products', 'Deleted product'), productController.deleteProduct);

module.exports = router;
