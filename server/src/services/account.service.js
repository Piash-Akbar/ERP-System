const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const BankAccount = require('../models/BankAccount');
const ApiError = require('../utils/apiError');
const { paginate } = require('../utils/pagination');

const getTransactions = async (query = {}) => {
  const { page, limit, search, type, category, startDate, endDate } = query;

  const filter = { isDeleted: false };

  if (type) {
    filter.type = type;
  }

  if (category) {
    filter.category = category;
  }

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [
      { category: regex },
      { description: regex },
      { reference: regex },
    ];
  }

  return paginate(Transaction, filter, {
    page,
    limit,
    sort: { date: -1 },
    populate: [
      { path: 'account', select: 'name accountNumber bankName type' },
      { path: 'createdBy', select: 'name email' },
    ],
  });
};

const createTransaction = async (data, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Build double-entry journal entries
    let accountName = 'Cash';
    if (data.account) {
      const bankAccount = await BankAccount.findById(data.account);
      if (bankAccount) accountName = bankAccount.name;
    }

    const journalEntries = [];
    if (data.type === 'income') {
      journalEntries.push(
        { accountName, debit: data.amount, credit: 0 },
        { accountName: data.category, debit: 0, credit: data.amount }
      );
    } else {
      journalEntries.push(
        { accountName: data.category, debit: data.amount, credit: 0 },
        { accountName, debit: 0, credit: data.amount }
      );
    }

    const transaction = await Transaction.create({
      ...data,
      journalEntries,
      createdBy: userId,
    });

    // Update bank account balance
    if (transaction.account) {
      const balanceChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      await BankAccount.findByIdAndUpdate(transaction.account, {
        $inc: { currentBalance: balanceChange },
      });
    }

    await session.commitTransaction();
    return transaction;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

const deleteTransaction = async (id) => {
  const transaction = await Transaction.findOne({ _id: id, isDeleted: false });
  if (!transaction) {
    throw new ApiError('Transaction not found', 404);
  }

  // Reverse the balance change on the bank account
  if (transaction.account) {
    const reversal = transaction.type === 'income' ? -transaction.amount : transaction.amount;
    await BankAccount.findByIdAndUpdate(transaction.account, {
      $inc: { currentBalance: reversal },
    });
  }

  transaction.isDeleted = true;
  await transaction.save();

  return transaction;
};

const getBankAccounts = async () => {
  return BankAccount.find({ isDeleted: false }).sort({ createdAt: -1 }).lean();
};

const createBankAccount = async (data) => {
  const account = await BankAccount.create({
    ...data,
    currentBalance: data.openingBalance || 0,
  });
  return account;
};

const updateBankAccount = async (id, data) => {
  const account = await BankAccount.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true, runValidators: true }
  );
  if (!account) {
    throw new ApiError('Bank account not found', 404);
  }
  return account;
};

const deleteBankAccount = async (id) => {
  const account = await BankAccount.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!account) {
    throw new ApiError('Bank account not found', 404);
  }
  return account;
};

const getSummary = async (query = {}) => {
  const { startDate, endDate } = query;

  const matchFilter = { isDeleted: false };
  if (startDate || endDate) {
    matchFilter.date = {};
    if (startDate) matchFilter.date.$gte = new Date(startDate);
    if (endDate) matchFilter.date.$lte = new Date(endDate);
  }

  const [summary] = await Transaction.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
        },
        totalExpense: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
        },
      },
    },
  ]);

  const totalIncome = summary?.totalIncome || 0;
  const totalExpense = summary?.totalExpense || 0;
  const netProfit = totalIncome - totalExpense;

  const bankBalances = await BankAccount.find({ isDeleted: false })
    .select('name type bankName currentBalance')
    .lean();

  return {
    totalIncome,
    totalExpense,
    netProfit,
    bankBalances,
  };
};

module.exports = {
  getTransactions,
  createTransaction,
  deleteTransaction,
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getSummary,
};
