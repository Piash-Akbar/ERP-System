const mongoose = require('mongoose');
const { MODULES, PERMISSIONS } = require('../config/constants');

const permissionSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      enum: Object.values(MODULES),
      required: true,
    },
    actions: [
      {
        type: String,
        enum: Object.values(PERMISSIONS),
      },
    ],
  },
  { _id: false }
);

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    permissions: [permissionSchema],
    isDefault: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Role', roleSchema);
