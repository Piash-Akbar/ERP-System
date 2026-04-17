const mongoose = require('mongoose');

const chartAccountSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Account code is required'],
      trim: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses'],
      required: [true, 'Account type is required'],
    },
    parentCode: {
      type: String,
      trim: true,
      default: '',
    },
    level: {
      type: Number,
      default: 0,
      min: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

chartAccountSchema.index({ isDeleted: 1, code: 1 });

module.exports = mongoose.model('ChartAccount', chartAccountSchema);
