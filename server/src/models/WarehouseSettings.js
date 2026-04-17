const mongoose = require('mongoose');

const warehouseSettingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    scanSettings: {
      continuousScanMode: {
        type: Boolean,
        default: true,
      },
      autoSubmit: {
        type: Boolean,
        default: false,
      },
      soundFeedback: {
        type: Boolean,
        default: true,
      },
    },
    offlineSync: {
      enabled: {
        type: Boolean,
        default: false,
      },
      lastSyncAt: {
        type: Date,
      },
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
    },
  },
  { timestamps: true }
);

warehouseSettingsSchema.index({ user: 1, warehouse: 1 }, { unique: true });

module.exports = mongoose.model('WarehouseSettings', warehouseSettingsSchema);
