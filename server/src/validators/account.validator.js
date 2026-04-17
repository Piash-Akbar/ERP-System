const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const createTransactionSchema = Joi.object({
  type: Joi.string().valid('income', 'expense').required(),
  category: Joi.string().trim().required(),
  amount: Joi.number().min(0).required(),
  account: objectId.allow('', null),
  date: Joi.date(),
  description: Joi.string().trim().allow(''),
  reference: Joi.string().trim().allow(''),
  paymentMethod: Joi.string().trim().allow(''),
});

const createExpenseSchema = Joi.object({
  category: Joi.string().trim().required(),
  amount: Joi.number().min(0).required(),
  account: objectId.allow('', null),
  date: Joi.date(),
  description: Joi.string().trim().allow(''),
  paymentMethod: Joi.string().trim().allow(''),
});

const createIncomeSchema = Joi.object({
  source: Joi.string().trim().required(),
  amount: Joi.number().min(0).required(),
  account: objectId.allow('', null),
  date: Joi.date(),
  description: Joi.string().trim().allow(''),
  paymentMethod: Joi.string().trim().allow(''),
});

const createChartAccountSchema = Joi.object({
  code: Joi.string().trim().required(),
  name: Joi.string().trim().required(),
  type: Joi.string().valid('Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses').required(),
  parentCode: Joi.string().trim().allow(''),
  balance: Joi.number(),
});

const createBankAccountSchema = Joi.object({
  name: Joi.string().trim().required(),
  accountNumber: Joi.string().trim().allow(''),
  bankName: Joi.string().trim().allow(''),
  branch: Joi.string().trim().allow(''),
  type: Joi.string().valid('cash', 'bank', 'mobile_banking'),
  openingBalance: Joi.number().min(0),
  isDefault: Joi.boolean(),
});

const updateBankAccountSchema = Joi.object({
  name: Joi.string().trim(),
  accountNumber: Joi.string().trim().allow(''),
  bankName: Joi.string().trim().allow(''),
  branch: Joi.string().trim().allow(''),
  type: Joi.string().valid('cash', 'bank', 'mobile_banking'),
  isDefault: Joi.boolean(),
  isActive: Joi.boolean(),
});

module.exports = {
  createTransactionSchema,
  createBankAccountSchema,
  updateBankAccountSchema,
  createExpenseSchema,
  createIncomeSchema,
  createChartAccountSchema,
};
