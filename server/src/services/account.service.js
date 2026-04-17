const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const BankAccount = require('../models/BankAccount');
const ChartAccount = require('../models/ChartAccount');
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

// ----- Expenses -----
const getExpenses = async (query = {}) => {
  return getTransactions({ ...query, type: 'expense' });
};

const createExpense = async (data, userId) => {
  return createTransaction({ ...data, type: 'expense' }, userId);
};

const deleteExpense = async (id) => deleteTransaction(id);

// ----- Incomes -----
const getIncomes = async (query = {}) => {
  const baseQuery = { ...query, type: 'income' };
  if (query.search) baseQuery.search = query.search;
  return getTransactions(baseQuery);
};

const createIncome = async (data, userId) => {
  const { source, ...rest } = data;
  return createTransaction(
    { ...rest, type: 'income', category: source || data.category },
    userId
  );
};

const deleteIncome = async (id) => deleteTransaction(id);

// ----- Chart of Accounts -----
const getChartOfAccounts = async () => {
  return ChartAccount.find({ isDeleted: false }).sort({ code: 1 }).lean();
};

const createChartAccount = async (data) => {
  const level = data.parentCode
    ? ((await ChartAccount.findOne({ code: data.parentCode, isDeleted: false }))?.level ?? 0) + 1
    : 0;
  const exists = await ChartAccount.findOne({ code: data.code, isDeleted: false });
  if (exists) throw new ApiError('Account code already exists', 400);
  return ChartAccount.create({ ...data, level });
};

const deleteChartAccount = async (id) => {
  const acc = await ChartAccount.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!acc) throw new ApiError('Chart account not found', 404);
  return acc;
};

// ----- Profit & Loss -----
const getProfitLoss = async (query = {}) => {
  const { startDate, endDate } = query;
  const match = { isDeleted: false };
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = new Date(startDate);
    if (endDate) match.date.$lte = new Date(endDate);
  }

  const [totals] = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
        totalExpenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
      },
    },
  ]);

  const totalRevenue = totals?.totalRevenue || 0;
  const totalExpenses = totals?.totalExpenses || 0;
  const netProfit = totalRevenue - totalExpenses;

  const monthly = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: { y: { $year: '$date' }, m: { $month: '$date' } },
        sales: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
        expenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
      },
    },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
    { $limit: 12 },
  ]);

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = monthly.map((m) => ({
    month: monthLabels[m._id.m - 1],
    sales: m.sales,
    expenses: m.expenses,
    profit: m.sales - m.expenses,
  }));

  const revenueBreakdown = await Transaction.aggregate([
    { $match: { ...match, type: 'income' } },
    { $group: { _id: '$category', amount: { $sum: '$amount' } } },
    { $project: { _id: 0, label: '$_id', amount: 1 } },
    { $sort: { amount: -1 } },
  ]);

  const expenseBreakdown = await Transaction.aggregate([
    { $match: { ...match, type: 'expense' } },
    { $group: { _id: '$category', amount: { $sum: '$amount' } } },
    { $project: { _id: 0, label: '$_id', amount: 1 } },
    { $sort: { amount: -1 } },
  ]);

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    monthlyData,
    revenueBreakdown,
    expenseBreakdown,
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
  getExpenses,
  createExpense,
  deleteExpense,
  getIncomes,
  createIncome,
  deleteIncome,
  getChartOfAccounts,
  createChartAccount,
  deleteChartAccount,
  getProfitLoss,
};
