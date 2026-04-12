const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

// ─── BOM ─────────────────────────────────────────────────
const createBOMSchema = Joi.object({
  name: Joi.string().trim().required(),
  product: objectId.allow('', null),
  version: Joi.string().trim(),
  materials: Joi.array().items(Joi.object({
    name: Joi.string().trim().required(),
    quantity: Joi.number().min(0).required(),
    unit: Joi.string().trim(),
    unitCost: Joi.number().min(0),
    totalCost: Joi.number().min(0),
  })),
  operations: Joi.array().items(Joi.object({
    name: Joi.string().trim().required(),
    description: Joi.string().trim().allow(''),
    duration: Joi.number().min(0),
    cost: Joi.number().min(0),
  })),
  materialCost: Joi.number().min(0),
  operationCost: Joi.number().min(0),
  totalCost: Joi.number().min(0),
  status: Joi.string().valid('active', 'draft'),
});

const updateBOMSchema = createBOMSchema.fork(['name'], (schema) => schema.optional());

// ─── Work Order ──────────────────────────────────────────
const createWorkOrderSchema = Joi.object({
  orderCode: Joi.string().trim().required(),
  product: objectId.allow('', null),
  productionPlan: objectId.allow('', null),
  quantity: Joi.number().min(1).required(),
  orderDate: Joi.date(),
  dueDate: Joi.date().required(),
  priority: Joi.string().valid('high', 'medium', 'low'),
  assignedTo: Joi.string().trim().allow(''),
  workCenter: objectId.allow('', null),
  status: Joi.string().valid('pending', 'in_progress', 'completed', 'shipping', 'cancelled'),
  notes: Joi.string().trim().allow(''),
});

const updateWorkOrderSchema = createWorkOrderSchema.fork(['orderCode', 'quantity', 'dueDate'], (schema) => schema.optional());

// ─── Work Center ─────────────────────────────────────────
const createWorkCenterSchema = Joi.object({
  name: Joi.string().trim().required(),
  description: Joi.string().trim().allow(''),
  capacity: Joi.number().min(1).required(),
  unit: Joi.string().trim(),
  status: Joi.string().valid('active', 'inactive'),
});

const updateWorkCenterSchema = createWorkCenterSchema.fork(['name', 'capacity'], (schema) => schema.optional());

// ─── Production Plan ─────────────────────────────────────
const createPlanSchema = Joi.object({
  planCode: Joi.string().trim(),
  product: objectId.allow('', null),
  quantity: Joi.number().min(1).required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  resources: Joi.string().trim().allow(''),
  materialStatus: Joi.string().valid('available', 'partial', 'shortage'),
  progress: Joi.number().min(0).max(100),
  status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled'),
  notes: Joi.string().trim().allow(''),
});

const updatePlanSchema = createPlanSchema.fork(['planCode', 'quantity', 'startDate', 'endDate'], (schema) => schema.optional());

// ─── Subcontracting Item ─────────────────────────────────
const createSubcontractingItemSchema = Joi.object({
  name: Joi.string().trim().required(),
  category: Joi.string().trim().allow(''),
  processType: Joi.string().trim().allow(''),
  supplier: objectId.allow('', null),
  unitCost: Joi.number().min(0),
});

const updateSubcontractingItemSchema = createSubcontractingItemSchema.fork(['name'], (schema) => schema.optional());

// ─── Subcontracting Order ────────────────────────────────
const createSubcontractingOrderSchema = Joi.object({
  orderCode: Joi.string().trim().required(),
  supplier: objectId.allow('', null),
  items: Joi.array().items(Joi.object({
    item: objectId.required(),
    quantity: Joi.number().min(1).required(),
    unitCost: Joi.number().min(0),
    totalCost: Joi.number().min(0),
  })).min(1),
  totalAmount: Joi.number().min(0),
  orderDate: Joi.date(),
  dueDate: Joi.date(),
  status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled'),
  paidAmount: Joi.number().min(0),
  dueAmount: Joi.number().min(0),
  notes: Joi.string().trim().allow(''),
});

const updateSubcontractingOrderSchema = createSubcontractingOrderSchema.fork(['orderCode'], (schema) => schema.optional());

module.exports = {
  createBOMSchema,
  updateBOMSchema,
  createWorkOrderSchema,
  updateWorkOrderSchema,
  createWorkCenterSchema,
  updateWorkCenterSchema,
  createPlanSchema,
  updatePlanSchema,
  createSubcontractingItemSchema,
  updateSubcontractingItemSchema,
  createSubcontractingOrderSchema,
  updateSubcontractingOrderSchema,
};
