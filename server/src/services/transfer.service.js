const MoneyTransfer = require('../models/MoneyTransfer');
const BankAccount = require('../models/BankAccount');
const ApiError = require('../utils/apiError');
const { paginate } = require('../utils/pagination');

const getMoneyTransfers = async (query) => {
  const filter = { isDeleted: false };

  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) filter.date.$gte = new Date(query.startDate);
    if (query.endDate) filter.date.$lte = new Date(query.endDate);
  }

  if (query.search) {
    filter.note = { $regex: query.search, $options: 'i' };
  }

  return paginate(MoneyTransfer, filter, {
    page: query.page,
    limit: query.limit,
    sort: { createdAt: -1 },
    populate: [
      { path: 'fromAccount', select: 'name accountNumber bankName' },
      { path: 'toAccount', select: 'name accountNumber bankName' },
      { path: 'transferredBy', select: 'name email' },
    ],
  });
};

const createMoneyTransfer = async (data, userId) => {
  const fromAccount = await BankAccount.findById(data.fromAccount);
  if (!fromAccount) throw new ApiError('Source account not found', 404);

  const toAccount = await BankAccount.findById(data.toAccount);
  if (!toAccount) throw new ApiError('Destination account not found', 404);

  if (fromAccount.currentBalance < data.amount) {
    throw new ApiError('Insufficient balance in source account', 400);
  }

  data.transferredBy = userId;
  const transfer = await MoneyTransfer.create(data);

  fromAccount.currentBalance -= data.amount;
  toAccount.currentBalance += data.amount;
  await fromAccount.save();
  await toAccount.save();

  return transfer;
};

const deleteMoneyTransfer = async (id) => {
  const transfer = await MoneyTransfer.findById(id);
  if (!transfer || transfer.isDeleted) throw new ApiError('Transfer not found', 404);

  // Reverse balance changes
  const fromAccount = await BankAccount.findById(transfer.fromAccount);
  const toAccount = await BankAccount.findById(transfer.toAccount);

  if (fromAccount) {
    fromAccount.currentBalance += transfer.amount;
    await fromAccount.save();
  }
  if (toAccount) {
    toAccount.currentBalance -= transfer.amount;
    await toAccount.save();
  }

  transfer.isDeleted = true;
  await transfer.save();
  return transfer;
};

module.exports = { getMoneyTransfers, createMoneyTransfer, deleteMoneyTransfer };
