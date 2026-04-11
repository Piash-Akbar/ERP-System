const express = require('express');
const router = express.Router();
const taxController = require('../controllers/tax.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');

router.use(protect);

router.get('/', authorize('products', 'read'), taxController.getTaxes);
router.post('/', authorize('products', 'create'), taxController.createTax);
router.put('/:id', authorize('products', 'update'), taxController.updateTax);
router.delete('/:id', authorize('products', 'delete'), taxController.deleteTax);

module.exports = router;
