const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema(
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
      enum: ['good', 'damaged', 'defective'],
      default: 'good',
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const warehouseReturnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      unique: true,
      required: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Warehouse is required'],
    },
    returnSource: {
      type: String,
      enum: ['customer', 'production', 'department', 'other'],
      required: [true, 'Return source is required'],
    },
    sourceRef: {
      type: String,
      trim: true,
    },
    items: [returnItemSchema],
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
    processedBy: {
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

warehouseReturnSchema.index({ warehouse: 1, branch: 1 });
warehouseReturnSchema.index({ returnNumber: 1 });
warehouseReturnSchema.index({ status: 1 });

module.exports = mongoose.model('WarehouseReturn', warehouseReturnSchema);
