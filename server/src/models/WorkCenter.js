const mongoose = require('mongoose');

const workCenterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Work center name is required'],
      trim: true,
    },
    description: { type: String },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: 1,
    },
    unit: {
      type: String,
      default: 'units/day',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkCenter', workCenterSchema);
