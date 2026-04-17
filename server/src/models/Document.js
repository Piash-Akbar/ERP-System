const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
    },
    filePath: {
      type: String,
      required: [true, 'File path is required'],
    },
    fileSize: {
      type: Number,
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    category: {
      type: String,
      enum: ['invoice', 'receipt', 'contract', 'warranty', 'certificate', 'report', 'legal', 'insurance', 'shipping', 'customs', 'hr', 'other'],
      required: [true, 'Category is required'],
    },
    tags: [{ type: String, trim: true }],
    linkedModule: {
      type: String,
      trim: true,
    },
    linkedModel: {
      type: String,
      trim: true,
    },
    linkedId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    version: {
      type: Number,
      default: 1,
    },
    previousVersion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
    isLatestVersion: {
      type: Boolean,
      default: true,
    },
    expiryDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'expired'],
      default: 'active',
    },
    accessRoles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

documentSchema.index({ linkedModule: 1, linkedId: 1, isDeleted: 1 });
documentSchema.index({ category: 1, isDeleted: 1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ expiryDate: 1, status: 1 });
documentSchema.index({ uploadedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
