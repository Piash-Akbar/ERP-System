const mongoose = require('mongoose');

const receivingItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    barcode: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    condition: {
      type: String,
      enum: ['good', 'damaged', 'rejected'],
      default: 'good',
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const goodsReceivingSchema = new mongoose.Schema(
  {
    grnNumber: {
      type: String,
      unique: true,
      required: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Warehouse is required'],
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
    },
    source: {
      type: String,
      enum: ['purchase', 'return', 'transfer', 'other'],
      default: 'purchase',
    },
    purchaseOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
    },
    reference: {
      type: String,
      trim: true,
    },
    items: [receivingItemSchema],
    totalItems: {
      type: Number,
      default: 0,
    },
    totalQuantity: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'completed', 'cancelled'],
      default: 'draft',
    },
    note: {
      type: String,
      trim: true,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
    },
  },
  { timestamps: true }
);

goodsReceivingSchema.index({ warehouse: 1, branch: 1 });
goodsReceivingSchema.index({ grnNumber: 1 });
goodsReceivingSchema.index({ status: 1 });

module.exports = mongoose.model('GoodsReceiving', goodsReceivingSchema);
