const mongoose = require('mongoose');

const bomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    version: { type: String, default: 'v1.0' },
    materials: [
      {
        name: { type: String },
        quantity: { type: Number },
        unit: { type: String },
        unitCost: { type: Number },
        totalCost: { type: Number },
      },
    ],
    operations: [
      {
        name: { type: String },
        description: { type: String },
        duration: { type: Number },
        cost: { type: Number },
      },
    ],
    materialCost: { type: Number, default: 0 },
    operationCost: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'draft'], default: 'draft' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

bomSchema.index({ product: 1 });
bomSchema.index({ status: 1, isDeleted: 1 });

module.exports = mongoose.model('BOM', bomSchema);
