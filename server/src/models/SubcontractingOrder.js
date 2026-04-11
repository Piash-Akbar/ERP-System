const mongoose = require('mongoose');

const subcontractingOrderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: true, unique: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    items: [
      {
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'SubcontractingItem' },
        quantity: { type: Number },
        unitCost: { type: Number },
        totalCost: { type: Number },
      },
    ],
    totalAmount: { type: Number, default: 0 },
    orderDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

subcontractingOrderSchema.index({ supplier: 1, status: 1 });
subcontractingOrderSchema.index({ dueDate: 1 });

module.exports = mongoose.model('SubcontractingOrder', subcontractingOrderSchema);
