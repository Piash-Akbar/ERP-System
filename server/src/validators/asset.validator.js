const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const createAssetSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required(),
  description: Joi.string().trim().allow('', null),
  category: objectId.required(),
  purchaseDate: Joi.date().required(),
  purchasePrice: Joi.number().min(0).required(),
  salvageValue: Joi.number().min(0).default(0),
  usefulLife: Joi.number().integer().min(1).required(),
  depreciationMethod: Joi.string().valid('straight_line', 'declining_balance', 'none').required(),
  depreciationRate: Joi.number().min(0).max(100).allow(null),
  location: objectId.allow('', null),
  warehouse: objectId.allow('', null),
  assignedTo: objectId.allow('', null),
  supplier: objectId.allow('', null),
  serialNumber: Joi.string().trim().allow('', null),
  barcode: Joi.string().trim().allow('', null),
  branch: objectId.allow('', null),
});

const updateAssetSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200),
  description: Joi.string().trim().allow('', null),
  category: objectId,
  purchaseDate: Joi.date(),
  purchasePrice: Joi.number().min(0),
  salvageValue: Joi.number().min(0),
  usefulLife: Joi.number().integer().min(1),
  depreciationMethod: Joi.string().valid('straight_line', 'declining_balance', 'none'),
  depreciationRate: Joi.number().min(0).max(100).allow(null),
  location: objectId.allow('', null),
  warehouse: objectId.allow('', null),
  assignedTo: objectId.allow('', null),
  supplier: objectId.allow('', null),
  serialNumber: Joi.string().trim().allow('', null),
  barcode: Joi.string().trim().allow('', null),
  branch: objectId.allow('', null),
  status: Joi.string().valid('active', 'in_maintenance', 'inactive'),
});

const maintenanceSchema = Joi.object({
  date: Joi.date().required(),
  type: Joi.string().valid('preventive', 'corrective', 'inspection').required(),
  description: Joi.string().trim().required(),
  cost: Joi.number().min(0).default(0),
  vendor: Joi.string().trim().allow('', null),
  nextMaintenanceDate: Joi.date().allow(null),
});

const disposeSchema = Joi.object({
  method: Joi.string().valid('sold', 'scrapped', 'donated', 'written_off').required(),
  saleAmount: Joi.number().min(0).default(0),
  reason: Joi.string().trim().allow('', null),
});

const assignSchema = Joi.object({
  assignedTo: objectId.required(),
});

const transferSchema = Joi.object({
  location: objectId.allow('', null),
  warehouse: objectId.allow('', null),
  branch: objectId.allow('', null),
});

const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().allow('', null),
  depreciationMethod: Joi.string().valid('straight_line', 'declining_balance', 'none'),
  defaultUsefulLife: Joi.number().integer().min(1).allow(null),
  defaultDepreciationRate: Joi.number().min(0).max(100).allow(null),
  accountCode: Joi.string().trim().allow('', null),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  description: Joi.string().trim().allow('', null),
  depreciationMethod: Joi.string().valid('straight_line', 'declining_balance', 'none'),
  defaultUsefulLife: Joi.number().integer().min(1).allow(null),
  defaultDepreciationRate: Joi.number().min(0).max(100).allow(null),
  accountCode: Joi.string().trim().allow('', null),
});

module.exports = {
  createAssetSchema,
  updateAssetSchema,
  maintenanceSchema,
  disposeSchema,
  assignSchema,
  transferSchema,
  createCategorySchema,
  updateCategorySchema,
};
