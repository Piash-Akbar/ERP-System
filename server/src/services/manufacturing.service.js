const BOM = require('../models/BOM');
const ProductionPlan = require('../models/ProductionPlan');
const WorkOrder = require('../models/WorkOrder');
const WorkCenter = require('../models/WorkCenter');
const SubcontractingItem = require('../models/SubcontractingItem');
const SubcontractingOrder = require('../models/SubcontractingOrder');
const ApiError = require('../utils/apiError');
const { paginate } = require('../utils/pagination');

// ─── BOM ─────────────────────────────────────────────────

const getAllBOMs = async (query = {}) => {
  const { page, limit, search } = query;

  const filter = { isDeleted: false };

  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [{ name: regex }, { version: regex }];
  }

  return paginate(BOM, filter, {
    page,
    limit,
    populate: { path: 'product', select: 'name sku' },
  });
};

const getBOMById = async (id) => {
  const bom = await BOM.findOne({ _id: id, isDeleted: false })
    .populate('product', 'name sku sellingPrice')
    .lean();
  if (!bom) {
    throw new ApiError('BOM not found', 404);
  }
  return bom;
};

const createBOM = async (data) => {
  const bom = await BOM.create(data);
  return bom.populate('product', 'name sku');
};

const updateBOM = async (id, data) => {
  const bom = await BOM.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true, runValidators: true }
  ).populate('product', 'name sku');
  if (!bom) {
    throw new ApiError('BOM not found', 404);
  }
  return bom;
};

const deleteBOM = async (id) => {
  const bom = await BOM.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!bom) {
    throw new ApiError('BOM not found', 404);
  }
  return bom;
};

// ─── Production Plan ─────────────────────────────────────

const getAllPlans = async (query = {}) => {
  const { page, limit, search, status } = query;

  const filter = { isDeleted: false };

  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [{ planCode: regex }, { notes: regex }];
  }
  if (status) {
    filter.status = status;
  }

  return paginate(ProductionPlan, filter, {
    page,
    limit,
    populate: [
      { path: 'product', select: 'name sku' },
      { path: 'createdBy', select: 'name email' },
    ],
  });
};

const getPlanById = async (id) => {
  const plan = await ProductionPlan.findOne({ _id: id, isDeleted: false })
    .populate('product', 'name sku')
    .populate('createdBy', 'name email');
  if (!plan) throw new ApiError('Production plan not found', 404);
  return plan;
};

const createPlan = async (data) => {
  if (!data.planCode) {
    const count = await ProductionPlan.countDocuments({});
    data.planCode = `PP-${String(count + 1).padStart(3, '0')}`;
  }
  const plan = await ProductionPlan.create(data);
  return plan.populate([
    { path: 'product', select: 'name sku' },
    { path: 'createdBy', select: 'name email' },
  ]);
};

const updatePlan = async (id, data) => {
  const plan = await ProductionPlan.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true, runValidators: true }
  ).populate([
    { path: 'product', select: 'name sku' },
    { path: 'createdBy', select: 'name email' },
  ]);
  if (!plan) {
    throw new ApiError('Production plan not found', 404);
  }
  return plan;
};

const deletePlan = async (id) => {
  const plan = await ProductionPlan.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!plan) {
    throw new ApiError('Production plan not found', 404);
  }
  return plan;
};

// ─── Work Order ──────────────────────────────────────────

const getAllWorkOrders = async (query = {}) => {
  const { page, limit, search, status, priority } = query;

  const filter = { isDeleted: false };

  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [{ orderCode: regex }, { assignedTo: regex }, { notes: regex }];
  }
  if (status) {
    filter.status = status;
  }
  if (priority) {
    filter.priority = priority;
  }

  return paginate(WorkOrder, filter, {
    page,
    limit,
    populate: [
      { path: 'product', select: 'name sku' },
      { path: 'productionPlan', select: 'planCode status' },
      { path: 'workCenter', select: 'name capacity unit' },
      { path: 'createdBy', select: 'name email' },
    ],
  });
};

const createWorkOrder = async (data) => {
  const order = await WorkOrder.create(data);
  return order.populate([
    { path: 'product', select: 'name sku' },
    { path: 'productionPlan', select: 'planCode status' },
    { path: 'workCenter', select: 'name capacity unit' },
    { path: 'createdBy', select: 'name email' },
  ]);
};

const updateWorkOrder = async (id, data) => {
  const order = await WorkOrder.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true, runValidators: true }
  ).populate([
    { path: 'product', select: 'name sku' },
    { path: 'productionPlan', select: 'planCode status' },
    { path: 'workCenter', select: 'name capacity unit' },
    { path: 'createdBy', select: 'name email' },
  ]);
  if (!order) {
    throw new ApiError('Work order not found', 404);
  }
  return order;
};

const deleteWorkOrder = async (id) => {
  const order = await WorkOrder.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!order) {
    throw new ApiError('Work order not found', 404);
  }
  return order;
};

// ─── Subcontracting Item ─────────────────────────────────

const getAllItems = async (query = {}) => {
  const { page, limit, search } = query;

  const filter = { isDeleted: false };

  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [{ name: regex }, { category: regex }, { processType: regex }];
  }

  return paginate(SubcontractingItem, filter, {
    page,
    limit,
    populate: { path: 'supplier', select: 'name company' },
  });
};

const createItem = async (data) => {
  const item = await SubcontractingItem.create(data);
  return item.populate('supplier', 'name company');
};

const updateItem = async (id, data) => {
  const item = await SubcontractingItem.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true, runValidators: true }
  ).populate('supplier', 'name company');
  if (!item) {
    throw new ApiError('Subcontracting item not found', 404);
  }
  return item;
};

const deleteItem = async (id) => {
  const item = await SubcontractingItem.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!item) {
    throw new ApiError('Subcontracting item not found', 404);
  }
  return item;
};

// ─── Subcontracting Order ────────────────────────────────

const getAllOrders = async (query = {}) => {
  const { page, limit, search, status } = query;

  const filter = { isDeleted: false };

  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [{ orderCode: regex }, { notes: regex }];
  }
  if (status) {
    filter.status = status;
  }

  return paginate(SubcontractingOrder, filter, {
    page,
    limit,
    populate: [
      { path: 'supplier', select: 'name company' },
      { path: 'items.item', select: 'name category processType' },
      { path: 'createdBy', select: 'name email' },
    ],
  });
};

const createOrder = async (data) => {
  const order = await SubcontractingOrder.create(data);
  return order.populate([
    { path: 'supplier', select: 'name company' },
    { path: 'items.item', select: 'name category processType' },
    { path: 'createdBy', select: 'name email' },
  ]);
};

const updateOrder = async (id, data) => {
  const order = await SubcontractingOrder.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true, runValidators: true }
  ).populate([
    { path: 'supplier', select: 'name company' },
    { path: 'items.item', select: 'name category processType' },
    { path: 'createdBy', select: 'name email' },
  ]);
  if (!order) {
    throw new ApiError('Subcontracting order not found', 404);
  }
  return order;
};

const deleteOrder = async (id) => {
  const order = await SubcontractingOrder.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!order) {
    throw new ApiError('Subcontracting order not found', 404);
  }
  return order;
};

// ─── Summary & Capacity ─────────────────────────────────

const getManufacturingSummary = async () => {
  const [
    totalPlans,
    activePlans,
    completedPlans,
    totalWorkOrders,
    pendingWorkOrders,
    inProgressWorkOrders,
    completedWorkOrders,
    totalBOMs,
    activeBOMs,
    totalSubOrders,
    pendingSubOrders,
  ] = await Promise.all([
    ProductionPlan.countDocuments({ isDeleted: false }),
    ProductionPlan.countDocuments({ isDeleted: false, status: 'in_progress' }),
    ProductionPlan.countDocuments({ isDeleted: false, status: 'completed' }),
    WorkOrder.countDocuments({ isDeleted: false }),
    WorkOrder.countDocuments({ isDeleted: false, status: 'pending' }),
    WorkOrder.countDocuments({ isDeleted: false, status: 'in_progress' }),
    WorkOrder.countDocuments({ isDeleted: false, status: 'completed' }),
    BOM.countDocuments({ isDeleted: false }),
    BOM.countDocuments({ isDeleted: false, status: 'active' }),
    SubcontractingOrder.countDocuments({ isDeleted: false }),
    SubcontractingOrder.countDocuments({ isDeleted: false, status: 'pending' }),
  ]);

  const bomCostAgg = await BOM.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: null, totalCost: { $sum: '$totalCost' } } },
  ]);

  const subOrderAgg = await SubcontractingOrder.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$totalAmount' },
        totalPaid: { $sum: '$paidAmount' },
        totalDue: { $sum: '$dueAmount' },
      },
    },
  ]);

  return {
    // Production Plans
    totalPlans,
    inProgressPlans: activePlans,
    completedPlans,
    // Work Orders
    totalWorkOrders,
    pendingOrders: pendingWorkOrders,
    inProgressOrders: inProgressWorkOrders,
    completedOrders: completedWorkOrders,
    // BOM
    totalBOMs,
    activeBOMs,
    totalBOMCost: bomCostAgg[0]?.totalCost || 0,
    // Subcontracting
    totalSubOrders,
    pendingSubOrders,
    totalSubAmount: subOrderAgg[0]?.totalAmount || 0,
    totalSubPaid: subOrderAgg[0]?.totalPaid || 0,
    totalSubDue: subOrderAgg[0]?.totalDue || 0,
  };
};

const getCapacitySummary = async () => {
  const workCenters = await WorkCenter.find({ isDeleted: false, status: 'active' }).lean();

  // Get active work orders grouped by work center
  const workOrders = await WorkOrder.find({
    isDeleted: false,
    status: { $in: ['pending', 'in_progress'] },
    workCenter: { $ne: null },
  }).lean();

  // Build allocation map: workCenterId -> total allocated qty
  const allocationMap = {};
  for (const wo of workOrders) {
    const wcId = wo.workCenter.toString();
    allocationMap[wcId] = (allocationMap[wcId] || 0) + wo.quantity;
  }

  // Build capacity data per work center
  const capacityData = workCenters.map((wc) => {
    const allocated = allocationMap[wc._id.toString()] || 0;
    const utilization = wc.capacity > 0 ? Math.round((allocated / wc.capacity) * 100) : 0;
    const available = Math.max(0, wc.capacity - allocated);
    return {
      _id: wc._id,
      name: wc.name,
      capacity: wc.capacity,
      unit: wc.unit,
      allocated,
      utilization: Math.min(utilization, 100),
      available,
    };
  });

  return capacityData;
};

// ─── Work Center ────────────────────────────────────────

const getAllWorkCenters = async (query = {}) => {
  const { page, limit, search } = query;
  const filter = { isDeleted: false };
  if (search) {
    filter.name = new RegExp(search, 'i');
  }
  return paginate(WorkCenter, filter, { page, limit });
};

const createWorkCenter = async (data) => {
  return WorkCenter.create(data);
};

const updateWorkCenter = async (id, data) => {
  const wc = await WorkCenter.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true, runValidators: true }
  );
  if (!wc) throw new ApiError('Work center not found', 404);
  return wc;
};

const deleteWorkCenter = async (id) => {
  const wc = await WorkCenter.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!wc) throw new ApiError('Work center not found', 404);
  return wc;
};

module.exports = {
  getAllBOMs,
  getBOMById,
  createBOM,
  updateBOM,
  deleteBOM,
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  getAllWorkOrders,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  getAllItems,
  createItem,
  updateItem,
  deleteItem,
  getAllOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  getAllWorkCenters,
  createWorkCenter,
  updateWorkCenter,
  deleteWorkCenter,
  getManufacturingSummary,
  getCapacitySummary,
};
