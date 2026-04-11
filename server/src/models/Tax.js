const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tax name is required'],
      trim: true,
    },
    rate: {
      type: Number,
      required: [true, 'Tax rate is required'],
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

taxSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Tax', taxSchema);
