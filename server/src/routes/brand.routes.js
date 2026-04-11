const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brand.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const { createBrandSchema, updateBrandSchema } = require('../validators/brand.validator');

router.use(protect);

router.get('/', authorize('products', 'view'), brandController.getBrands);
router.post('/', authorize('products', 'create'), validate(createBrandSchema), logActivity('products', 'Created brand'), brandController.createBrand);
router.put('/:id', authorize('products', 'edit'), validate(updateBrandSchema), logActivity('products', 'Updated brand'), brandController.updateBrand);
router.delete('/:id', authorize('products', 'delete'), logActivity('products', 'Deleted brand'), brandController.deleteBrand);

module.exports = router;
