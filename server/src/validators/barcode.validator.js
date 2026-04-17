const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const generateSchema = Joi.object({
  productId: objectId.required(),
  variantId: objectId.allow('', null),
  barcodeType: Joi.string().valid('CODE128', 'EAN13', 'EAN8', 'UPC', 'QR').default('CODE128'),
  prefix: Joi.string().trim().max(10).default('ANX'),
});

const generateBulkSchema = Joi.object({
  productIds: Joi.array().items(objectId).min(1).required(),
  barcodeType: Joi.string().valid('CODE128', 'EAN13', 'EAN8', 'UPC', 'QR').default('CODE128'),
  prefix: Joi.string().trim().max(10).default('ANX'),
});

const assignSchema = Joi.object({
  productId: objectId.required(),
  variantId: objectId.allow('', null),
  barcode: Joi.string().trim().min(3).max(50).required(),
  barcodeType: Joi.string().valid('CODE128', 'EAN13', 'EAN8', 'UPC', 'QR').default('CODE128'),
});

const logPrintSchema = Joi.object({
  barcodes: Joi.array().items(Joi.string().trim()).min(1).required(),
});

module.exports = {
  generateSchema,
  generateBulkSchema,
  assignSchema,
  logPrintSchema,
};
