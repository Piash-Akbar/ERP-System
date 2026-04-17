const mongoose = require('mongoose');

const conditionSchema = new mongoose.Schema(
  {
    field: { type: String, required: true },
    operator: { type: String, enum: ['gt', 'gte', 'lt', 'lte', 'eq', 'ne'], required: true },
    value: { type: Number, required: true },
  },
  { _id: false }
);

const levelSchema = new mongoose.Schema(
  {
    level: { type: Number, required: true, min: 1 },
    approverRoles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
    approverUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    requiredCount: { type: Number, default: 1, min: 1 },
    escalateAfterHours: { type: Number, default: 48 },
  },
  { _id: true }
);

const approvalRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Rule name is required'],
      trim: true,
    },
    module: {
      type: String,
      required: [true, 'Module is required'],
      trim: true,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
    },
    conditions: [conditionSchema],
    levels: {
      type: [levelSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'At least one approval level is required',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
    },
    priority: {
      type: Number,
      default: 0,
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

approvalRuleSchema.index({ module: 1, action: 1, isActive: 1, isDeleted: 1 });

module.exports = mongoose.model('ApprovalRule', approvalRuleSchema);
