const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const itemSchema = Joi.object({
  product: objectId.required(),
  variantId: objectId.allow(null),
  barcode: Joi.string().trim().allow(''),
  quantity: Joi.number().min(1).required(),
  note: Joi.string().trim().allow(''),
});

const goodsReceivingSchema = Joi.object({
  warehouse: objectId.required(),
  supplier: objectId.allow(null, ''),
  source: Joi.string().valid('purchase', 'return', 'transfer', 'other').default('purchase'),
  purchaseOrder: objectId.allow(null, ''),
  reference: Joi.string().trim().allow(''),
  items: Joi.array()
    .items(
      itemSchema.keys({
        condition: Joi.string().valid('good', 'damaged', 'rejected').default('good'),
      })
    )
    .min(1)
    .required(),
  note: Joi.string().trim().allow(''),
  branch: objectId.allow(null, ''),
});

const goodsIssueSchema = Joi.object({
  warehouse: objectId.required(),
  destination: Joi.string().trim().allow(''),
  destinationType: Joi.string().valid('sale', 'production', 'department', 'other').default('other'),
  reference: Joi.string().trim().allow(''),
  items: Joi.array().items(itemSchema).min(1).required(),
  note: Joi.string().trim().allow(''),
  branch: objectId.allow(null, ''),
});

const warehouseTransferSchema = Joi.object({
  fromWarehouse: objectId.required(),
  toWarehouse: objectId.required(),
  product: objectId.required(),
  variantId: objectId.allow(null),
  quantity: Joi.number().min(1).required(),
  note: Joi.string().trim().allow(''),
  branch: objectId.allow(null, ''),
});

const warehouseReturnSchema = Joi.object({
  warehouse: objectId.required(),
  returnSource: Joi.string().valid('customer', 'production', 'department', 'other').required(),
  sourceRef: Joi.string().trim().allow(''),
  items: Joi.array()
    .items(
      itemSchema.keys({
        condition: Joi.string().valid('good', 'damaged', 'defective').default('good'),
      })
    )
    .min(1)
    .required(),
  note: Joi.string().trim().allow(''),
  branch: objectId.allow(null, ''),
});

const stockCountSchema = Joi.object({
  sessionName: Joi.string().trim().required(),
  warehouse: objectId.required(),
  note: Joi.string().trim().allow(''),
  branch: objectId.allow(null, ''),
});

const scanCountItemSchema = Joi.object({
  barcode: Joi.string().trim(),
  productId: objectId,
  quantity: Joi.number().min(1).default(1),
}).or('barcode', 'productId');

const reconciliationAdjustSchema = Joi.object({
  warehouse: objectId.required(),
  items: Joi.array()
    .items(
      Joi.object({
        product: objectId.required(),
        variantId: objectId.allow(null),
        systemQty: Joi.number().required(),
        physicalQty: Joi.number().min(0).required(),
        reason: Joi.string().trim().allow(''),
      })
    )
    .min(1)
    .required(),
});

const warehouseSettingsSchema = Joi.object({
  warehouse: objectId.allow(null, ''),
  scanSettings: Joi.object({
    continuousScanMode: Joi.boolean(),
    autoSubmit: Joi.boolean(),
    soundFeedback: Joi.boolean(),
  }),
  offlineSync: Joi.object({
    enabled: Joi.boolean(),
  }),
});

module.exports = {
  goodsReceivingSchema,
  goodsIssueSchema,
  warehouseTransferSchema,
  warehouseReturnSchema,
  stockCountSchema,
  scanCountItemSchema,
  reconciliationAdjustSchema,
  warehouseSettingsSchema,
};
