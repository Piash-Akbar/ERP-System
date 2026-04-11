const Joi = require('joi');

const createBranchSchema = Joi.object({
  name: Joi.string().trim().required(),
  code: Joi.string().trim().uppercase().required(),
  address: Joi.string().trim().allow(''),
  phone: Joi.string().trim().allow(''),
  email: Joi.string().email().lowercase().trim().allow(''),
});

const updateBranchSchema = Joi.object({
  name: Joi.string().trim(),
  code: Joi.string().trim().uppercase(),
  address: Joi.string().trim().allow(''),
  phone: Joi.string().trim().allow(''),
  email: Joi.string().email().lowercase().trim().allow(''),
});

const createWarehouseSchema = Joi.object({
  name: Joi.string().trim().required(),
  code: Joi.string().trim().uppercase().required(),
  address: Joi.string().trim().allow(''),
  branch: Joi.string().required(),
});

const updateWarehouseSchema = Joi.object({
  name: Joi.string().trim(),
  code: Joi.string().trim().uppercase(),
  address: Joi.string().trim().allow(''),
  branch: Joi.string(),
});

module.exports = {
  createBranchSchema,
  updateBranchSchema,
  createWarehouseSchema,
  updateWarehouseSchema,
};
