const Joi = require('joi');

const createTaxSchema = Joi.object({
  name: Joi.string().trim().required(),
  rate: Joi.number().min(0).required(),
});

const updateTaxSchema = Joi.object({
  name: Joi.string().trim(),
  rate: Joi.number().min(0),
  isActive: Joi.boolean(),
});

module.exports = {
  createTaxSchema,
  updateTaxSchema,
};
