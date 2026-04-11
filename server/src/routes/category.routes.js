const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');

router.use(protect);

router.get('/', authorize('products', 'read'), categoryController.getCategories);
router.post('/', authorize('products', 'create'), categoryController.createCategory);
router.put('/:id', authorize('products', 'update'), categoryController.updateCategory);
router.delete('/:id', authorize('products', 'delete'), categoryController.deleteCategory);

module.exports = router;
