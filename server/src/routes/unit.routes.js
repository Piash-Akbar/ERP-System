const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unit.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const { createUnitSchema, updateUnitSchema } = require('../validators/unit.validator');

router.use(protect);

router.get('/', authorize('products', 'view'), unitController.getUnits);
router.post('/', authorize('products', 'create'), validate(createUnitSchema), logActivity('products', 'Created unit'), unitController.createUnit);
router.put('/:id', authorize('products', 'edit'), validate(updateUnitSchema), logActivity('products', 'Updated unit'), unitController.updateUnit);
router.delete('/:id', authorize('products', 'delete'), logActivity('products', 'Deleted unit'), unitController.deleteUnit);

module.exports = router;
