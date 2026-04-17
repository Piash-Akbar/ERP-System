const mongoose = require('mongoose');

const barcodeLogSchema = new mongoose.Schema(
  {
    barcode: {
      type: String,
      required: [true, 'Barcode is required'],
      unique: true,
      trim: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    type: {
      type: String,
      enum: ['generated', 'manual', 'imported'],
      required: true,
    },
    barcodeType: {
      type: String,
      enum: ['CODE128', 'EAN13', 'EAN8', 'UPC', 'QR'],
      default: 'CODE128',
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    printCount: {
      type: Number,
      default: 0,
    },
    lastPrintedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

barcodeLogSchema.index({ barcode: 1 });
barcodeLogSchema.index({ product: 1 });

module.exports = mongoose.model('BarcodeLog', barcodeLogSchema);
