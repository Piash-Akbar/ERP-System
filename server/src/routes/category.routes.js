const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const { createCategorySchema, updateCategorySchema } = require('../validators/category.validator');

router.use(protect);

router.get('/', authorize('products', 'view'), categoryController.getCategories);
router.post('/', authorize('products', 'create'), validate(createCategorySchema), logActivity('products', 'Created category'), categoryController.createCategory);
router.put('/:id', authorize('products', 'edit'), validate(updateCategorySchema), logActivity('products', 'Updated category'), categoryController.updateCategory);
router.delete('/:id', authorize('products', 'delete'), logActivity('products', 'Deleted category'), categoryController.deleteCategory);

module.exports = router;
