const mongoose = require('mongoose');

const productionPlanSchema = new mongoose.Schema(
  {
    planCode: { type: String, required: true, unique: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    resources: { type: String },
    materialStatus: {
      type: String,
      enum: ['available', 'partial', 'shortage'],
      default: 'available',
    },
    progress: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productionPlanSchema.index({ status: 1, isDeleted: 1 });
productionPlanSchema.index({ startDate: -1, endDate: -1 });

module.exports = mongoose.model('ProductionPlan', productionPlanSchema);
