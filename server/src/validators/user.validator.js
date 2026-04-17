const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(8).max(128).required(),
  phone: Joi.string().trim().allow('', null),
  role: objectId.required(),
  branch: objectId.allow('', null),
  isActive: Joi.boolean(),
});

const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  email: Joi.string().email().lowercase().trim(),
  phone: Joi.string().trim().allow('', null),
  role: objectId,
  branch: objectId.allow('', null),
  isActive: Joi.boolean(),
});

const toggleStatusSchema = Joi.object({
  isActive: Joi.boolean().required(),
});

const resetPasswordSchema = Joi.object({
  newPassword: Joi.string().min(8).max(128).required(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  toggleStatusSchema,
  resetPasswordSchema,
};
