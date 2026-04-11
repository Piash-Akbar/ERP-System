const asyncHandler = require('../utils/asyncHandler');
const mfgService = require('../services/manufacturing.service');

// ─── BOM ─────────────────────────────────────────────────

const getBOMs = asyncHandler(async (req, res) => {
  const result = await mfgService.getAllBOMs(req.query);
  res.json({ success: true, data: result, message: 'BOMs retrieved' });
});

const getBOMById = asyncHandler(async (req, res) => {
  const bom = await mfgService.getBOMById(req.params.id);
  res.json({ success: true, data: bom, message: 'BOM retrieved' });
});

const createBOM = asyncHandler(async (req, res) => {
  const bom = await mfgService.createBOM(req.body);
  res.status(201).json({ success: true, data: bom, message: 'BOM created' });
});

const updateBOM = asyncHandler(async (req, res) => {
  const bom = await mfgService.updateBOM(req.params.id, req.body);
  res.json({ success: true, data: bom, message: 'BOM updated' });
});

const deleteBOM = asyncHandler(async (req, res) => {
  await mfgService.deleteBOM(req.params.id);
  res.json({ success: true, data: null, message: 'BOM deleted' });
});

// ─── Production Plan ─────────────────────────────────────

const getPlans = asyncHandler(async (req, res) => {
  const result = await mfgService.getAllPlans(req.query);
  res.json({ success: true, data: result, message: 'Production plans retrieved' });
});

const createPlan = asyncHandler(async (req, res) => {
  const plan = await mfgService.createPlan(req.body);
  res.status(201).json({ success: true, data: plan, message: 'Production plan created' });
});

const updatePlan = asyncHandler(async (req, res) => {
  const plan = await mfgService.updatePlan(req.params.id, req.body);
  res.json({ success: true, data: plan, message: 'Production plan updated' });
});

const deletePlan = asyncHandler(async (req, res) => {
  await mfgService.deletePlan(req.params.id);
  res.json({ success: true, data: null, message: 'Production plan deleted' });
});

// ─── Work Order ──────────────────────────────────────────

const getWorkOrders = asyncHandler(async (req, res) => {
  const result = await mfgService.getAllWorkOrders(req.query);
  res.json({ success: true, data: result, message: 'Work orders retrieved' });
});

const createWorkOrder = asyncHandler(async (req, res) => {
  const order = await mfgService.createWorkOrder(req.body);
  res.status(201).json({ success: true, data: order, message: 'Work order created' });
});

const updateWorkOrder = asyncHandler(async (req, res) => {
  const order = await mfgService.updateWorkOrder(req.params.id, req.body);
  res.json({ success: true, data: order, message: 'Work order updated' });
});

const deleteWorkOrder = asyncHandler(async (req, res) => {
  await mfgService.deleteWorkOrder(req.params.id);
  res.json({ success: true, data: null, message: 'Work order deleted' });
});

// ─── Subcontracting Item ─────────────────────────────────

const getSubcontractingItems = asyncHandler(async (req, res) => {
  const result = await mfgService.getAllItems(req.query);
  res.json({ success: true, data: result, message: 'Subcontracting items retrieved' });
});

const createSubcontractingItem = asyncHandler(async (req, res) => {
  const item = await mfgService.createItem(req.body);
  res.status(201).json({ success: true, data: item, message: 'Subcontracting item created' });
});

const updateSubcontractingItem = asyncHandler(async (req, res) => {
  const item = await mfgService.updateItem(req.params.id, req.body);
  res.json({ success: true, data: item, message: 'Subcontracting item updated' });
});

const deleteSubcontractingItem = asyncHandler(async (req, res) => {
  await mfgService.deleteItem(req.params.id);
  res.json({ success: true, data: null, message: 'Subcontracting item deleted' });
});

// ─── Subcontracting Order ────────────────────────────────

const getSubcontractingOrders = asyncHandler(async (req, res) => {
  const result = await mfgService.getAllOrders(req.query);
  res.json({ success: true, data: result, message: 'Subcontracting orders retrieved' });
});

const createSubcontractingOrder = asyncHandler(async (req, res) => {
  const order = await mfgService.createOrder(req.body);
  res.status(201).json({ success: true, data: order, message: 'Subcontracting order created' });
});

const updateSubcontractingOrder = asyncHandler(async (req, res) => {
  const order = await mfgService.updateOrder(req.params.id, req.body);
  res.json({ success: true, data: order, message: 'Subcontracting order updated' });
});

const deleteSubcontractingOrder = asyncHandler(async (req, res) => {
  await mfgService.deleteOrder(req.params.id);
  res.json({ success: true, data: null, message: 'Subcontracting order deleted' });
});

// ─── Work Center ────────────────────────────────────────

const getWorkCenters = asyncHandler(async (req, res) => {
  const result = await mfgService.getAllWorkCenters(req.query);
  res.json({ success: true, data: result, message: 'Work centers retrieved' });
});

const createWorkCenter = asyncHandler(async (req, res) => {
  const wc = await mfgService.createWorkCenter(req.body);
  res.status(201).json({ success: true, data: wc, message: 'Work center created' });
});

const updateWorkCenter = asyncHandler(async (req, res) => {
  const wc = await mfgService.updateWorkCenter(req.params.id, req.body);
  res.json({ success: true, data: wc, message: 'Work center updated' });
});

const deleteWorkCenter = asyncHandler(async (req, res) => {
  await mfgService.deleteWorkCenter(req.params.id);
  res.json({ success: true, data: null, message: 'Work center deleted' });
});

// ─── Summary & Capacity ─────────────────────────────────

const getSummary = asyncHandler(async (req, res) => {
  const result = await mfgService.getManufacturingSummary();
  res.json({ success: true, data: result, message: 'Manufacturing summary retrieved' });
});

const getCapacity = asyncHandler(async (req, res) => {
  const result = await mfgService.getCapacitySummary();
  res.json({ success: true, data: result, message: 'Capacity summary retrieved' });
});

module.exports = {
  getBOMs,
  getBOMById,
  createBOM,
  updateBOM,
  deleteBOM,
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getWorkOrders,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  getSubcontractingItems,
  createSubcontractingItem,
  updateSubcontractingItem,
  deleteSubcontractingItem,
  getSubcontractingOrders,
  createSubcontractingOrder,
  updateSubcontractingOrder,
  deleteSubcontractingOrder,
  getWorkCenters,
  createWorkCenter,
  updateWorkCenter,
  deleteWorkCenter,
  getSummary,
  getCapacity,
};
