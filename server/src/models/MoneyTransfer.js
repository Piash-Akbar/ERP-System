const mongoose = require('mongoose');

const moneyTransferSchema = new mongoose.Schema(
  {
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BankAccount',
      required: [true, 'From account is required'],
    },
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BankAccount',
      required: [true, 'To account is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
    },
    transferredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MoneyTransfer', moneyTransferSchema);
