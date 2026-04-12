const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const paymentSchema = Joi.object({
  amount: Joi.number().min(0).required(),
  method: Joi.string().valid('cash', 'bank', 'mobile_banking', 'cheque'),
  account: objectId.allow('', null),
  date: Joi.date(),
  note: Joi.string().trim().allow(''),
});

const saleItemSchema = Joi.object({
  product: objectId.required(),
  variantId: objectId.allow(null),
  name: Joi.string().trim(),
  sku: Joi.string().trim(),
  quantity: Joi.number().min(1).required(),
  unitPrice: Joi.number().min(0).required(),
  discount: Joi.number().min(0),
  tax: Joi.number().min(0),
  subtotal: Joi.number().min(0),
});

const createSaleSchema = Joi.object({
  saleType: Joi.string().valid('product', 'service'),
  customer: objectId.required(),
  saleDate: Joi.date(),
  items: Joi.array().items(saleItemSchema).min(1).required(),
  subtotal: Joi.number().min(0).required(),
  discountAmount: Joi.number().min(0),
  taxAmount: Joi.number().min(0),
  shippingCharge: Joi.number().min(0),
  otherCharge: Joi.number().min(0),
  grandTotal: Joi.number().min(0).required(),
  previousDue: Joi.number().min(0),
  payments: Joi.array().items(paymentSchema),
  paidAmount: Joi.number().min(0),
  dueAmount: Joi.number().min(0),
  status: Joi.string().valid('draft', 'confirmed', 'delivered', 'returned', 'cancelled'),
  note: Joi.string().trim().allow(''),
  branch: objectId.allow('', null),
  warehouse: objectId.allow('', null),
});

const addPaymentSchema = Joi.object({
  amount: Joi.number().min(0).required(),
  method: Joi.string().valid('cash', 'bank', 'mobile_banking', 'cheque'),
  account: objectId.allow('', null),
  date: Joi.date(),
  note: Joi.string().trim().allow(''),
});

const updateSaleStatusSchema = Joi.object({
  status: Joi.string().valid('draft', 'confirmed', 'delivered', 'returned', 'cancelled').required(),
});

module.exports = {
  createSaleSchema,
  addPaymentSchema,
  updateSaleStatusSchema,
};
