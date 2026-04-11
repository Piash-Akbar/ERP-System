const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');

router.use(protect);

router.get('/', authorize('inventory', 'read'), inventoryController.getStockList);
router.get('/low-stock', authorize('inventory', 'read'), inventoryController.getLowStock);
router.post('/adjust', authorize('inventory', 'create'), inventoryController.adjustStock);
router.post('/transfer', authorize('inventory', 'create'), inventoryController.transferStock);
router.get('/adjustments', authorize('inventory', 'read'), inventoryController.getAdjustments);
router.get('/transfers', authorize('inventory', 'read'), inventoryController.getTransfers);

module.exports = router;
