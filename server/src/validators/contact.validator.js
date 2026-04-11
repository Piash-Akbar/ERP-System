const Joi = require('joi');

const createContactSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  type: Joi.string().valid('customer', 'supplier', 'both').required(),
  company: Joi.string().trim().allow(''),
  email: Joi.string().email().lowercase().trim().allow(''),
  phone: Joi.string().trim().allow(''),
  address: Joi.string().trim().allow(''),
  city: Joi.string().trim().allow(''),
  country: Joi.string().trim().allow(''),
  taxNumber: Joi.string().trim().allow(''),
  openingBalance: Joi.number().min(0),
  creditLimit: Joi.number().min(0),
});

const updateContactSchema = Joi.object({
  name: Joi.string().trim().min(2),
  type: Joi.string().valid('customer', 'supplier', 'both'),
  company: Joi.string().trim().allow(''),
  email: Joi.string().email().lowercase().trim().allow(''),
  phone: Joi.string().trim().allow(''),
  address: Joi.string().trim().allow(''),
  city: Joi.string().trim().allow(''),
  country: Joi.string().trim().allow(''),
  taxNumber: Joi.string().trim().allow(''),
  openingBalance: Joi.number().min(0),
  creditLimit: Joi.number().min(0),
});

module.exports = {
  createContactSchema,
  updateContactSchema,
};
