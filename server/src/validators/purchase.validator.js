const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const purchaseItemSchema = Joi.object({
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

const paymentSchema = Joi.object({
  amount: Joi.number().min(0).required(),
  method: Joi.string().valid('cash', 'bank', 'mobile_banking', 'cheque'),
  account: objectId.allow('', null),
  date: Joi.date(),
  note: Joi.string().trim().allow(''),
});

const createPurchaseSchema = Joi.object({
  supplier: objectId.required(),
  purchaseDate: Joi.date(),
  items: Joi.array().items(purchaseItemSchema).min(1).required(),
  subtotal: Joi.number().min(0).required(),
  discountAmount: Joi.number().min(0),
  taxAmount: Joi.number().min(0),
  shippingCharge: Joi.number().min(0),
  otherCharge: Joi.number().min(0),
  grandTotal: Joi.number().min(0).required(),
  payments: Joi.array().items(paymentSchema),
  paidAmount: Joi.number().min(0),
  dueAmount: Joi.number().min(0),
  status: Joi.string().valid('ordered', 'received', 'partial', 'returned', 'cancelled'),
  note: Joi.string().trim().allow(''),
  branch: objectId.allow('', null),
  warehouse: objectId.allow('', null),
  lcNumber: Joi.string().trim().allow(''),
});

const addPaymentSchema = Joi.object({
  amount: Joi.number().min(0).required(),
  method: Joi.string().valid('cash', 'bank', 'mobile_banking', 'cheque'),
  account: objectId.allow('', null),
  date: Joi.date(),
  note: Joi.string().trim().allow(''),
});

const updatePurchaseStatusSchema = Joi.object({
  status: Joi.string().valid('ordered', 'received', 'partial', 'returned', 'cancelled').required(),
});

const returnItemSchema = Joi.object({
  itemId: objectId.required(),
  variantId: objectId.allow(null),
  quantity: Joi.number().min(1).required(),
});

const createReturnSchema = Joi.object({
  items: Joi.array().items(returnItemSchema).min(1).required(),
  note: Joi.string().trim().allow(''),
});

module.exports = {
  createPurchaseSchema,
  addPaymentSchema,
  updatePurchaseStatusSchema,
  createReturnSchema,
};
