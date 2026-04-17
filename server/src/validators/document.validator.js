const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const createDocumentSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  description: Joi.string().trim().allow('', null),
  category: Joi.string().valid('invoice', 'receipt', 'contract', 'warranty', 'certificate', 'report', 'legal', 'insurance', 'shipping', 'customs', 'hr', 'other').required(),
  tags: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim()),
    Joi.string().trim()
  ).allow('', null),
  linkedModule: Joi.string().trim().allow('', null),
  linkedModel: Joi.string().trim().allow('', null),
  linkedId: objectId.allow('', null),
  expiryDate: Joi.date().allow('', null),
  accessRoles: Joi.alternatives().try(
    Joi.array().items(objectId),
    Joi.string().trim()
  ).allow('', null),
  branch: objectId.allow('', null),
});

const updateDocumentSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200),
  description: Joi.string().trim().allow('', null),
  category: Joi.string().valid('invoice', 'receipt', 'contract', 'warranty', 'certificate', 'report', 'legal', 'insurance', 'shipping', 'customs', 'hr', 'other'),
  tags: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim()),
    Joi.string().trim()
  ).allow('', null),
  linkedModule: Joi.string().trim().allow('', null),
  linkedModel: Joi.string().trim().allow('', null),
  linkedId: objectId.allow('', null),
  expiryDate: Joi.date().allow('', null),
  accessRoles: Joi.alternatives().try(
    Joi.array().items(objectId),
    Joi.string().trim()
  ).allow('', null),
  status: Joi.string().valid('active', 'archived', 'expired'),
});

const linkDocumentSchema = Joi.object({
  linkedModule: Joi.string().trim().required(),
  linkedModel: Joi.string().trim().required(),
  linkedId: objectId.required(),
});

module.exports = {
  createDocumentSchema,
  updateDocumentSchema,
  linkDocumentSchema,
};
