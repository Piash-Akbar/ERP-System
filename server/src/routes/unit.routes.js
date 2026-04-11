const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unit.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');

router.use(protect);

router.get('/', authorize('products', 'read'), unitController.getUnits);
router.post('/', authorize('products', 'create'), unitController.createUnit);
router.put('/:id', authorize('products', 'update'), unitController.updateUnit);
router.delete('/:id', authorize('products', 'delete'), unitController.deleteUnit);

module.exports = router;
