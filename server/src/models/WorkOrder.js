const mongoose = require('mongoose');

const workOrderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: true, unique: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productionPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionPlan' },
    quantity: { type: Number, required: true },
    orderDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    assignedTo: { type: String },
    workCenter: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkCenter' },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'shipping', 'cancelled'],
      default: 'pending',
    },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

workOrderSchema.index({ status: 1, isDeleted: 1 });
workOrderSchema.index({ dueDate: 1 });
workOrderSchema.index({ workCenter: 1 });

module.exports = mongoose.model('WorkOrder', workOrderSchema);
