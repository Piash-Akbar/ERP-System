const mongoose = require('mongoose');

const cnfSchema = new mongoose.Schema(
  {
    agent: {
      type: String,
      required: true,
      trim: true,
    },
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
    },
    lcNumber: {
      type: String,
      trim: true,
    },
    documents: [String],
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    note: String,
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

cnfSchema.index({ purchase: 1 });
cnfSchema.index({ status: 1, isDeleted: 1 });

module.exports = mongoose.model('CNF', cnfSchema);
