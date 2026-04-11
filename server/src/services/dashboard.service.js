const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Contact = require('../models/Contact');
const Product = require('../models/Product');
const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');

const getDateFilter = (period) => {
  const now = new Date();
  let start;

  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(now.getFullYear(), 0, 1);
  }

  return { $gte: start, $lte: now };
};

const getSummary = async (period) => {
  const dateFilter = getDateFilter(period);

  const [
    salesAgg,
    purchaseAgg,
    expenseAgg,
    incomeAgg,
    bankAccounts,
    customerDueAgg,
    supplierDueAgg,
    totalCustomers,
    totalSuppliers,
    totalProducts,
    lowStockCount,
    recentSales,
    recentPurchases,
  ] = await Promise.all([
    // Total sales
    Sale.aggregate([
      { $match: { isDeleted: false, isReturn: false, saleDate: dateFilter } },
      { $group: { _id: null, total: { $sum: '$grandTotal' }, paid: { $sum: '$paidAmount' }, due: { $sum: '$dueAmount' }, count: { $sum: 1 } } },
    ]),
    // Total purchases
    Purchase.aggregate([
      { $match: { isDeleted: false, isReturn: false, purchaseDate: dateFilter } },
      { $group: { _id: null, total: { $sum: '$grandTotal' }, paid: { $sum: '$paidAmount' }, due: { $sum: '$dueAmount' }, count: { $sum: 1 } } },
    ]),
    // Expenses
    Transaction.aggregate([
      { $match: { type: 'expense', isDeleted: false, date: dateFilter } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    // Income
    Transaction.aggregate([
      { $match: { type: 'income', isDeleted: false, date: dateFilter } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    // Bank balances
    BankAccount.find({ isDeleted: false, isActive: true }).select('name type currentBalance').lean(),
    // Customer dues
    Contact.aggregate([
      { $match: { type: { $in: ['customer', 'both'] }, isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$currentDue' } } },
    ]),
    // Supplier dues
    Contact.aggregate([
      { $match: { type: { $in: ['supplier', 'both'] }, isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$currentDue' } } },
    ]),
    // Counts
    Contact.countDocuments({ type: { $in: ['customer', 'both'] }, isDeleted: false }),
    Contact.countDocuments({ type: { $in: ['supplier', 'both'] }, isDeleted: false }),
    Product.countDocuments({ isDeleted: false }),
    Product.countDocuments({ isDeleted: false, $expr: { $lte: ['$stock', '$alertQuantity'] } }),
    // Recent sales
    Sale.find({ isDeleted: false, isReturn: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'name')
      .select('invoiceNo customer grandTotal dueAmount paymentStatus saleDate')
      .lean(),
    // Recent purchases
    Purchase.find({ isDeleted: false, isReturn: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('supplier', 'name')
      .select('referenceNo supplier grandTotal dueAmount paymentStatus purchaseDate')
      .lean(),
  ]);

  const totalSales = salesAgg[0]?.total || 0;
  const totalPurchase = purchaseAgg[0]?.total || 0;
  const totalExpense = expenseAgg[0]?.total || 0;
  const totalIncome = incomeAgg[0]?.total || 0;
  const totalBankBalance = bankAccounts.reduce((sum, a) => sum + a.currentBalance, 0);

  return {
    cards: {
      totalSales,
      totalPurchase,
      totalExpense,
      totalIncome,
      netProfit: totalSales - totalPurchase - totalExpense + totalIncome,
      salesCount: salesAgg[0]?.count || 0,
      purchaseCount: purchaseAgg[0]?.count || 0,
      salesDue: salesAgg[0]?.due || 0,
      purchaseDue: purchaseAgg[0]?.due || 0,
      customerDue: customerDueAgg[0]?.total || 0,
      supplierDue: supplierDueAgg[0]?.total || 0,
      bankBalance: totalBankBalance,
      cashBalance: bankAccounts.find((a) => a.type === 'cash')?.currentBalance || 0,
    },
    counts: {
      customers: totalCustomers,
      suppliers: totalSuppliers,
      products: totalProducts,
      lowStock: lowStockCount,
    },
    bankAccounts,
    recentSales,
    recentPurchases,
  };
};

const getMonthlySalesExpense = async () => {
  const year = new Date().getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);

  const [salesByMonth, purchasesByMonth, expensesByMonth] = await Promise.all([
    Sale.aggregate([
      { $match: { isDeleted: false, isReturn: false, saleDate: { $gte: start, $lte: end } } },
      { $group: { _id: { $month: '$saleDate' }, total: { $sum: '$grandTotal' } } },
      { $sort: { _id: 1 } },
    ]),
    Purchase.aggregate([
      { $match: { isDeleted: false, isReturn: false, purchaseDate: { $gte: start, $lte: end } } },
      { $group: { _id: { $month: '$purchaseDate' }, total: { $sum: '$grandTotal' } } },
      { $sort: { _id: 1 } },
    ]),
    Transaction.aggregate([
      { $match: { type: 'expense', isDeleted: false, date: { $gte: start, $lte: end } } },
      { $group: { _id: { $month: '$date' }, total: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return months.map((name, i) => ({
    month: name,
    sales: salesByMonth.find((s) => s._id === i + 1)?.total || 0,
    purchases: purchasesByMonth.find((p) => p._id === i + 1)?.total || 0,
    expenses: expensesByMonth.find((e) => e._id === i + 1)?.total || 0,
  }));
};

module.exports = { getSummary, getMonthlySalesExpense };
