const mongoose = require('mongoose');

const approvalEntrySchema = new mongoose.Schema(
  {
    level: { type: Number, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ['approved', 'rejected', 'hold', 'change_request'], required: true },
    comment: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const approvalRequestSchema = new mongoose.Schema(
  {
    rule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApprovalRule',
    },
    module: {
      type: String,
      required: [true, 'Module is required'],
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
    },
    sourceModel: {
      type: String,
      required: [true, 'Source model is required'],
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Source ID is required'],
    },
    sourceRef: {
      type: String,
      trim: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
    },
    currentLevel: {
      type: Number,
      default: 1,
    },
    totalLevels: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'on_hold', 'cancelled', 'escalated'],
      default: 'pending',
    },
    approvals: [approvalEntrySchema],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    dueDate: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

approvalRequestSchema.index({ status: 1, currentLevel: 1, createdAt: -1 });
approvalRequestSchema.index({ submittedBy: 1, createdAt: -1 });
approvalRequestSchema.index({ module: 1, sourceId: 1 });

module.exports = mongoose.model('ApprovalRequest', approvalRequestSchema);
