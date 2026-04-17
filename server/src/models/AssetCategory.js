const mongoose = require('mongoose');

const assetCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    depreciationMethod: {
      type: String,
      enum: ['straight_line', 'declining_balance', 'none'],
      default: 'straight_line',
    },
    defaultUsefulLife: {
      type: Number,
      min: 0,
    },
    defaultDepreciationRate: {
      type: Number,
      min: 0,
      max: 100,
    },
    accountCode: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

assetCategorySchema.index({ isDeleted: 1 });

module.exports = mongoose.model('AssetCategory', assetCategorySchema);
