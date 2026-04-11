const Joi = require('joi');

const bulkUpsertSchema = Joi.object({
  settings: Joi.array().items(Joi.object({
    key: Joi.string().trim().required(),
    value: Joi.any().required(),
    group: Joi.string().trim().allow(''),
  })).min(1).required(),
}).unknown(true);

module.exports = {
  bulkUpsertSchema,
};
