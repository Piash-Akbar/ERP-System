const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const createLeaveTypeSchema = Joi.object({
  name: Joi.string().trim().required(),
  daysAllowed: Joi.number().min(0).required(),
  carryForward: Joi.boolean(),
  maxCarryForwardDays: Joi.number().min(0),
  isPaid: Joi.boolean(),
});

const updateLeaveTypeSchema = Joi.object({
  name: Joi.string().trim(),
  daysAllowed: Joi.number().min(0),
  carryForward: Joi.boolean(),
  maxCarryForwardDays: Joi.number().min(0),
  isPaid: Joi.boolean(),
  isActive: Joi.boolean(),
});

const createApplicationSchema = Joi.object({
  staff: objectId.required(),
  leaveType: objectId.required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  totalDays: Joi.number().min(0.5).required(),
  reason: Joi.string().trim().allow(''),
});

const createHolidaySchema = Joi.object({
  name: Joi.string().trim().required(),
  date: Joi.date().required(),
  isRecurring: Joi.boolean(),
});

module.exports = {
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
  createApplicationSchema,
  createHolidaySchema,
};
