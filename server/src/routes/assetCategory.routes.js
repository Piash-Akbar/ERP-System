const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/asset.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const { createCategorySchema, updateCategorySchema } = require('../validators/asset.validator');

router.use(protect);

router
  .route('/')
  .get(authorize('assets', 'view'), ctrl.getCategories)
  .post(authorize('assets', 'create'), validate(createCategorySchema), logActivity('assets', 'Created asset category'), ctrl.createCategory);

router
  .route('/:id')
  .get(authorize('assets', 'view'), ctrl.getCategory)
  .put(authorize('assets', 'edit'), validate(updateCategorySchema), logActivity('assets', 'Updated asset category'), ctrl.updateCategory)
  .delete(authorize('assets', 'delete'), logActivity('assets', 'Deleted asset category'), ctrl.deleteCategory);

module.exports = router;
