const Joi = require('joi');

const createUnitSchema = Joi.object({
  name: Joi.string().trim().required(),
  shortName: Joi.string().trim().required(),
});

const updateUnitSchema = Joi.object({
  name: Joi.string().trim(),
  shortName: Joi.string().trim(),
  isActive: Joi.boolean(),
});

module.exports = {
  createUnitSchema,
  updateUnitSchema,
};
