const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const createCategorySchema = Joi.object({
  name: Joi.string().trim().required(),
  description: Joi.string().trim().allow(''),
  parent: objectId.allow('', null),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim(),
  description: Joi.string().trim().allow(''),
  parent: objectId.allow('', null),
  isActive: Joi.boolean(),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
};
