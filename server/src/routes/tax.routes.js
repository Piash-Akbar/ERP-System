const express = require('express');
const router = express.Router();
const taxController = require('../controllers/tax.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const { createTaxSchema, updateTaxSchema } = require('../validators/tax.validator');

router.use(protect);

router.get('/', authorize('products', 'view'), taxController.getTaxes);
router.post('/', authorize('products', 'create'), validate(createTaxSchema), logActivity('products', 'Created tax'), taxController.createTax);
router.put('/:id', authorize('products', 'edit'), validate(updateTaxSchema), logActivity('products', 'Updated tax'), taxController.updateTax);
router.delete('/:id', authorize('products', 'delete'), logActivity('products', 'Deleted tax'), taxController.deleteTax);

module.exports = router;
