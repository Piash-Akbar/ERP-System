const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const variantSchema = Joi.object({
  name: Joi.string().trim().required(),
  sku: Joi.string().trim().required(),
  purchasePrice: Joi.number().min(0).required(),
  sellingPrice: Joi.number().min(0).required(),
  minSellingPrice: Joi.number().min(0),
  stock: Joi.number().min(0),
  alertQuantity: Joi.number().min(0),
});

const createProductSchema = Joi.object({
  name: Joi.string().trim().required(),
  sku: Joi.string().trim().required(),
  type: Joi.string().valid('single', 'variant', 'combo').default('single'),
  category: objectId.allow('', null),
  brand: objectId.allow('', null),
  unit: objectId.allow('', null),
  tax: objectId.allow('', null),
  purchasePrice: Joi.number().min(0).required(),
  sellingPrice: Joi.number().min(0).required(),
  minSellingPrice: Joi.number().min(0),
  alertQuantity: Joi.number().min(0),
  description: Joi.string().trim().allow(''),
  image: Joi.string().allow('', null),
  serialTracking: Joi.boolean(),
  warehouse: objectId.allow('', null),
  variants: Joi.when('type', {
    is: 'variant',
    then: Joi.array().items(variantSchema).min(1),
    otherwise: Joi.array().items(variantSchema),
  }),
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim(),
  sku: Joi.string().trim(),
  type: Joi.string().valid('single', 'variant', 'combo'),
  category: objectId.allow('', null),
  brand: objectId.allow('', null),
  unit: objectId.allow('', null),
  tax: objectId.allow('', null),
  purchasePrice: Joi.number().min(0),
  sellingPrice: Joi.number().min(0),
  minSellingPrice: Joi.number().min(0),
  alertQuantity: Joi.number().min(0),
  description: Joi.string().trim().allow(''),
  image: Joi.string().allow('', null),
  serialTracking: Joi.boolean(),
  warehouse: objectId.allow('', null),
  variants: Joi.array().items(variantSchema),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
};
