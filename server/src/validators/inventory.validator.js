const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const adjustStockSchema = Joi.object({
  product: objectId.required(),
  variantId: objectId.allow(null),
  warehouse: objectId.allow('', null),
  type: Joi.string().valid('addition', 'subtraction').required(),
  quantity: Joi.number().min(1).required(),
  reason: Joi.string().trim().allow(''),
  note: Joi.string().trim().allow(''),
});

const transferStockSchema = Joi.object({
  product: objectId.required(),
  variantId: objectId.allow(null),
  fromWarehouse: objectId.required(),
  toWarehouse: objectId.required(),
  quantity: Joi.number().min(1).required(),
  status: Joi.string().valid('pending', 'completed', 'cancelled'),
  note: Joi.string().trim().allow(''),
});

const openingStockSchema = Joi.object({
  product: objectId.required(),
  variantId: objectId.allow('', null),
  warehouse: objectId.required(),
  quantity: Joi.number().min(1).required(),
  value: Joi.number().min(0).allow(null),
  date: Joi.date().required(),
  note: Joi.string().trim().allow(''),
});

module.exports = {
  adjustStockSchema,
  transferStockSchema,
  openingStockSchema,
};
