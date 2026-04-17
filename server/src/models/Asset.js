const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    type: { type: String, enum: ['preventive', 'corrective', 'inspection'], required: true },
    description: { type: String, required: true },
    cost: { type: Number, default: 0, min: 0 },
    vendor: { type: String, trim: true },
    nextMaintenanceDate: { type: Date },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: true }
);

const depreciationEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    bookValue: { type: Number, required: true },
  },
  { _id: false }
);

const assetSchema = new mongoose.Schema(
  {
    assetCode: {
      type: String,
      required: [true, 'Asset code is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssetCategory',
      required: [true, 'Category is required'],
    },
    purchaseDate: {
      type: Date,
      required: [true, 'Purchase date is required'],
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: 0,
    },
    currentValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    salvageValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    usefulLife: {
      type: Number,
      required: [true, 'Useful life is required'],
      min: 1,
    },
    depreciationMethod: {
      type: String,
      enum: ['straight_line', 'declining_balance', 'none'],
      required: true,
    },
    depreciationRate: {
      type: Number,
      min: 0,
      max: 100,
    },
    accumulatedDepreciation: {
      type: Number,
      default: 0,
    },
    lastDepreciationDate: {
      type: Date,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
    },
    serialNumber: {
      type: String,
      trim: true,
    },
    barcode: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'in_maintenance', 'disposed', 'transferred', 'inactive'],
      default: 'active',
    },
    maintenanceHistory: [maintenanceSchema],
    disposal: {
      date: { type: Date },
      method: { type: String, enum: ['sold', 'scrapped', 'donated', 'written_off'] },
      saleAmount: { type: Number, default: 0 },
      reason: { type: String },
      disposedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    depreciationSchedule: [depreciationEntrySchema],
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

assetSchema.index({ category: 1, isDeleted: 1 });
assetSchema.index({ status: 1, isDeleted: 1 });
assetSchema.index({ branch: 1, isDeleted: 1 });
assetSchema.index({ assignedTo: 1 });
assetSchema.index({ assetCode: 1 });

module.exports = mongoose.model('Asset', assetSchema);
