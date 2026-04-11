const Joi = require('joi');

const createBrandSchema = Joi.object({
  name: Joi.string().trim().required(),
  description: Joi.string().trim().allow(''),
});

const updateBrandSchema = Joi.object({
  name: Joi.string().trim(),
  description: Joi.string().trim().allow(''),
  isActive: Joi.boolean(),
});

module.exports = {
  createBrandSchema,
  updateBrandSchema,
};
