const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Setting key is required'],
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Setting value is required'],
    },
    group: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

settingSchema.index({ group: 1 });

module.exports = mongoose.model('Setting', settingSchema);
