const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brand.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');

router.use(protect);

router.get('/', authorize('products', 'read'), brandController.getBrands);
router.post('/', authorize('products', 'create'), brandController.createBrand);
router.put('/:id', authorize('products', 'update'), brandController.updateBrand);
router.delete('/:id', authorize('products', 'delete'), brandController.deleteBrand);

module.exports = router;
