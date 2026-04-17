const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    minSellingPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    stock: {
      type: Number,
      default: 0,
    },
    alertQuantity: {
      type: Number,
      default: 5,
    },
    barcode: {
      type: String,
      trim: true,
    },
    barcodeType: {
      type: String,
      enum: ['CODE128', 'EAN13', 'EAN8', 'UPC', 'QR'],
      default: 'CODE128',
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['single', 'variant', 'combo'],
      default: 'single',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
    },
    tax: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tax',
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: 0,
    },
    minSellingPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    stock: {
      type: Number,
      default: 0,
    },
    warehouseStock: [
      {
        warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
        quantity: { type: Number, default: 0, min: 0 },
      },
    ],
    alertQuantity: {
      type: Number,
      default: 5,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    variants: [variantSchema],
    comboProducts: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
    serialTracking: {
      type: Boolean,
      default: false,
    },
    serialNumbers: [
      {
        serial: { type: String, required: true, trim: true },
        status: { type: String, enum: ['available', 'sold'], default: 'available' },
        soldTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
      },
    ],
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    barcode: {
      type: String,
      trim: true,
      sparse: true,
    },
    barcodeType: {
      type: String,
      enum: ['CODE128', 'EAN13', 'EAN8', 'UPC', 'QR'],
      default: 'CODE128',
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

productSchema.index({ category: 1, isDeleted: 1 });
productSchema.index({ brand: 1, isDeleted: 1 });
productSchema.index({ barcode: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Product', productSchema);
