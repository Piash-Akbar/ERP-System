const mongoose = require('mongoose');

const subcontractingItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String },
    processType: { type: String },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    unitCost: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

subcontractingItemSchema.index({ supplier: 1, isDeleted: 1 });

module.exports = mongoose.model('SubcontractingItem', subcontractingItemSchema);
