const mongoose = require('mongoose');

const countItemSchema = new mongoose.Schema(
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
    systemQuantity: {
      type: Number,
      default: 0,
    },
    countedQuantity: {
      type: Number,
      default: 0,
    },
    difference: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'counted', 'verified'],
      default: 'pending',
    },
    countedAt: {
      type: Date,
    },
  },
  { _id: true }
);

const stockCountSessionSchema = new mongoose.Schema(
  {
    sessionName: {
      type: String,
      required: [true, 'Session name is required'],
      trim: true,
    },
    sessionNumber: {
      type: String,
      unique: true,
      required: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Warehouse is required'],
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'cancelled'],
      default: 'not_started',
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    items: [countItemSchema],
    totalProducts: {
      type: Number,
      default: 0,
    },
    itemsCounted: {
      type: Number,
      default: 0,
    },
    totalVariance: {
      type: Number,
      default: 0,
    },
    note: {
      type: String,
      trim: true,
    },
    createdBy: {
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

stockCountSessionSchema.index({ warehouse: 1, branch: 1 });
stockCountSessionSchema.index({ status: 1 });
stockCountSessionSchema.index({ sessionNumber: 1 });

module.exports = mongoose.model('StockCountSession', stockCountSessionSchema);
