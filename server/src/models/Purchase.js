const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    name: String,
    sku: String,
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      required: true,
    },
  },
  { _id: true }
);

const paymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      enum: ['cash', 'bank', 'mobile_banking', 'cheque'],
      default: 'cash',
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BankAccount',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: String,
  },
  { _id: true }
);

const purchaseSchema = new mongoose.Schema(
  {
    referenceNo: {
      type: String,
      required: true,
      unique: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      required: true,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    items: [purchaseItemSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    shippingCharge: {
      type: Number,
      default: 0,
    },
    otherCharge: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    payments: [paymentSchema],
    paidAmount: {
      type: Number,
      default: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['ordered', 'received', 'partial', 'returned', 'cancelled'],
      default: 'received',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid',
    },
    note: String,
    documents: [String],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    lcNumber: {
      type: String,
      trim: true,
    },
    isReturn: {
      type: Boolean,
      default: false,
    },
    returnRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

purchaseSchema.index({ supplier: 1, isDeleted: 1 });
purchaseSchema.index({ purchaseDate: -1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
