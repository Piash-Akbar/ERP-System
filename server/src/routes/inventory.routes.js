const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const { adjustStockSchema, transferStockSchema } = require('../validators/inventory.validator');

router.use(protect);

router.get('/', authorize('inventory', 'view'), inventoryController.getStockList);
router.get('/low-stock', authorize('inventory', 'view'), inventoryController.getLowStock);
router.post('/adjust', authorize('inventory', 'create'), validate(adjustStockSchema), logActivity('inventory', 'Adjusted stock'), inventoryController.adjustStock);
router.post('/transfer', authorize('inventory', 'create'), validate(transferStockSchema), logActivity('inventory', 'Transferred stock'), inventoryController.transferStock);
router.get('/adjustments', authorize('inventory', 'view'), inventoryController.getAdjustments);
router.get('/adjustments/:id', authorize('inventory', 'view'), inventoryController.getAdjustmentById);
router.get('/transfers', authorize('inventory', 'view'), inventoryController.getTransfers);
router.get('/transfers/:id', authorize('inventory', 'view'), inventoryController.getTransferById);

module.exports = router;
