const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouse.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const { createWarehouseSchema, updateWarehouseSchema } = require('../validators/location.validator');

router.use(protect);
router.use(authorize('locations', 'view'));

router.get('/', warehouseController.getWarehouses);
router.get('/:id', warehouseController.getWarehouse);

router.post(
  '/',
  authorize('locations', 'create'),
  validate(createWarehouseSchema),
  logActivity('locations', 'Created warehouse'),
  warehouseController.createWarehouse
);

router.put(
  '/:id',
  authorize('locations', 'edit'),
  validate(updateWarehouseSchema),
  logActivity('locations', 'Updated warehouse'),
  warehouseController.updateWarehouse
);

router.delete(
  '/:id',
  authorize('locations', 'delete'),
  logActivity('locations', 'Deleted warehouse'),
  warehouseController.deleteWarehouse
);

module.exports = router;
