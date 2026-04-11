const mongoose = require('mongoose');

const stockAdjustmentSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    type: {
      type: String,
      enum: ['addition', 'subtraction'],
      required: [true, 'Adjustment type is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    reason: {
      type: String,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
    adjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

stockAdjustmentSchema.index({ product: 1, warehouse: 1 });
stockAdjustmentSchema.index({ adjustedBy: 1 });

module.exports = mongoose.model('StockAdjustment', stockAdjustmentSchema);
