const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: [true, 'Staff is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Loan amount is required'],
    },
    monthlyDeduction: {
      type: Number,
      required: [true, 'Monthly deduction is required'],
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    remainingBalance: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedDate: {
      type: Date,
    },
    reason: {
      type: String,
    },
  },
  { timestamps: true }
);

loanSchema.pre('save', function (next) {
  if (this.isNew && !this.remainingBalance) {
    this.remainingBalance = this.amount;
  }
  next();
});

module.exports = mongoose.model('Loan', loanSchema);
