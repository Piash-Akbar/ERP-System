const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const submitApprovalSchema = Joi.object({
  module: Joi.string().trim().required(),
  action: Joi.string().trim().required(),
  sourceModel: Joi.string().trim().required(),
  sourceId: objectId.required(),
  sourceRef: Joi.string().trim().allow('', null),
  branch: objectId.allow('', null),
  metadata: Joi.object().allow(null),
});

const approvalActionSchema = Joi.object({
  comment: Joi.string().trim().allow('', null),
});

const createRuleSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required(),
  module: Joi.string().trim().required(),
  action: Joi.string().trim().required(),
  conditions: Joi.array().items(
    Joi.object({
      field: Joi.string().trim().required(),
      operator: Joi.string().valid('gt', 'gte', 'lt', 'lte', 'eq', 'ne').required(),
      value: Joi.number().required(),
    })
  ),
  levels: Joi.array()
    .items(
      Joi.object({
        level: Joi.number().integer().min(1).required(),
        approverRoles: Joi.array().items(objectId),
        approverUsers: Joi.array().items(objectId),
        requiredCount: Joi.number().integer().min(1).default(1),
        escalateAfterHours: Joi.number().min(1).default(48),
      })
    )
    .min(1)
    .required(),
  isActive: Joi.boolean(),
  branch: objectId.allow('', null),
  priority: Joi.number().integer().min(0),
});

const updateRuleSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200),
  module: Joi.string().trim(),
  action: Joi.string().trim(),
  conditions: Joi.array().items(
    Joi.object({
      field: Joi.string().trim().required(),
      operator: Joi.string().valid('gt', 'gte', 'lt', 'lte', 'eq', 'ne').required(),
      value: Joi.number().required(),
    })
  ),
  levels: Joi.array()
    .items(
      Joi.object({
        level: Joi.number().integer().min(1).required(),
        approverRoles: Joi.array().items(objectId),
        approverUsers: Joi.array().items(objectId),
        requiredCount: Joi.number().integer().min(1),
        escalateAfterHours: Joi.number().min(1),
      })
    )
    .min(1),
  isActive: Joi.boolean(),
  branch: objectId.allow('', null),
  priority: Joi.number().integer().min(0),
});

module.exports = {
  submitApprovalSchema,
  approvalActionSchema,
  createRuleSchema,
  updateRuleSchema,
};
