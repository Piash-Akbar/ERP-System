const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const createCNFSchema = Joi.object({
  agent: Joi.string().trim().required(),
  purchase: objectId.allow('', null),
  lcNumber: Joi.string().trim().allow(''),
  status: Joi.string().valid('pending', 'in_progress', 'completed'),
  note: Joi.string().trim().allow(''),
});

const updateCNFSchema = Joi.object({
  agent: Joi.string().trim(),
  purchase: objectId.allow('', null),
  lcNumber: Joi.string().trim().allow(''),
  status: Joi.string().valid('pending', 'in_progress', 'completed'),
  note: Joi.string().trim().allow(''),
});

module.exports = {
  createCNFSchema,
  updateCNFSchema,
};
