const mongoose = require('mongoose');

const issueItemSchema = new mongoose.Schema(
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
    note: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const goodsIssueSchema = new mongoose.Schema(
  {
    issueNumber: {
      type: String,
      unique: true,
      required: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Warehouse is required'],
    },
    destination: {
      type: String,
      trim: true,
    },
    destinationType: {
      type: String,
      enum: ['sale', 'production', 'department', 'other'],
      default: 'other',
    },
    reference: {
      type: String,
      trim: true,
    },
    items: [issueItemSchema],
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
    issuedBy: {
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

goodsIssueSchema.index({ warehouse: 1, branch: 1 });
goodsIssueSchema.index({ issueNumber: 1 });
goodsIssueSchema.index({ status: 1 });

module.exports = mongoose.model('GoodsIssue', goodsIssueSchema);
