const mongoose = require('mongoose');

const warehouseMovementSchema = new mongoose.Schema(
  {
    movementType: {
      type: String,
      enum: ['receiving', 'issue', 'transfer_in', 'transfer_out', 'return', 'adjustment', 'count_adjustment'],
      required: [true, 'Movement type is required'],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Warehouse is required'],
    },
    sourceWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    destinationWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    reference: {
      type: String,
      trim: true,
    },
    referenceModel: {
      type: String,
      enum: ['GoodsReceiving', 'GoodsIssue', 'StockTransfer', 'WarehouseReturn', 'StockCountSession', 'StockAdjustment'],
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
    },
    note: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

warehouseMovementSchema.index({ warehouse: 1, date: -1 });
warehouseMovementSchema.index({ movementType: 1 });
warehouseMovementSchema.index({ product: 1 });
warehouseMovementSchema.index({ branch: 1 });
warehouseMovementSchema.index({ referenceId: 1 });

module.exports = mongoose.model('WarehouseMovement', warehouseMovementSchema);
