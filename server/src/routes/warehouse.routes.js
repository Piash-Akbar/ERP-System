const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouse.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { validate } = require('../middlewares/validate');
const { createWarehouseSchema, updateWarehouseSchema } = require('../validators/location.validator');

router.use(protect);
router.use(authorize('locations', 'read'));

router.get('/', warehouseController.getWarehouses);
router.get('/:id', warehouseController.getWarehouse);

router.post(
  '/',
  authorize('locations', 'create'),
  validate(createWarehouseSchema),
  warehouseController.createWarehouse
);

router.put(
  '/:id',
  authorize('locations', 'update'),
  validate(updateWarehouseSchema),
  warehouseController.updateWarehouse
);

router.delete(
  '/:id',
  authorize('locations', 'delete'),
  warehouseController.deleteWarehouse
);

module.exports = router;
