const warehouseService = require('../services/warehouse.service');
const asyncHandler = require('../utils/asyncHandler');

const getWarehouses = asyncHandler(async (req, res) => {
  const warehouses = await warehouseService.getAll(req.query);
  res.json({ success: true, data: warehouses, message: 'Warehouses retrieved' });
});

const getWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await warehouseService.getById(req.params.id);
  res.json({ success: true, data: warehouse, message: 'Warehouse retrieved' });
});

const createWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await warehouseService.create(req.body);
  res.status(201).json({ success: true, data: warehouse, message: 'Warehouse created' });
});

const updateWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await warehouseService.update(req.params.id, req.body);
  res.json({ success: true, data: warehouse, message: 'Warehouse updated' });
});

const deleteWarehouse = asyncHandler(async (req, res) => {
  await warehouseService.delete(req.params.id);
  res.json({ success: true, data: null, message: 'Warehouse deleted' });
});

module.exports = {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
};
