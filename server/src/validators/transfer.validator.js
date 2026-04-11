const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const createMoneyTransferSchema = Joi.object({
  fromAccount: objectId.required(),
  toAccount: objectId.required(),
  amount: Joi.number().min(0.01).required(),
  date: Joi.date(),
  note: Joi.string().trim().allow(''),
});

module.exports = {
  createMoneyTransferSchema,
};
