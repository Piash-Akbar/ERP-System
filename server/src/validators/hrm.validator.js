const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const createStaffSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().email().lowercase().trim().required(),
  phone: Joi.string().trim().allow(''),
  role: objectId.required(),
  branch: objectId.allow('', null),
  employeeId: Joi.string().trim().required(),
  department: Joi.string().trim().allow(''),
  designation: Joi.string().trim().allow(''),
  joiningDate: Joi.date(),
  basicSalary: Joi.number().min(0),
  allowances: Joi.number().min(0),
  deductions: Joi.number().min(0),
  bankAccount: Joi.string().trim().allow(''),
  bankName: Joi.string().trim().allow(''),
  emergencyContact: Joi.object({
    name: Joi.string().trim().allow(''),
    phone: Joi.string().trim().allow(''),
    relation: Joi.string().trim().allow(''),
  }),
});

const updateStaffSchema = Joi.object({
  name: Joi.string().trim(),
  email: Joi.string().email().lowercase().trim(),
  phone: Joi.string().trim().allow(''),
  role: objectId,
  branch: objectId.allow('', null),
  department: Joi.string().trim().allow(''),
  designation: Joi.string().trim().allow(''),
  joiningDate: Joi.date(),
  basicSalary: Joi.number().min(0),
  allowances: Joi.number().min(0),
  deductions: Joi.number().min(0),
  bankAccount: Joi.string().trim().allow(''),
  bankName: Joi.string().trim().allow(''),
  emergencyContact: Joi.object({
    name: Joi.string().trim().allow(''),
    phone: Joi.string().trim().allow(''),
    relation: Joi.string().trim().allow(''),
  }),
});

const markAttendanceSchema = Joi.object({
  staff: objectId.required(),
  date: Joi.date().required(),
  status: Joi.string().valid('present', 'absent', 'late', 'half_day', 'on_leave').required(),
  checkIn: Joi.string().trim().allow(''),
  checkOut: Joi.string().trim().allow(''),
  note: Joi.string().trim().allow(''),
});

const generatePayrollSchema = Joi.object({
  month: Joi.number().min(1).max(12).required(),
  year: Joi.number().min(2000).required(),
});

const createLoanSchema = Joi.object({
  staff: objectId.required(),
  amount: Joi.number().min(1).required(),
  monthlyDeduction: Joi.number().min(1).required(),
  reason: Joi.string().trim().allow(''),
});

module.exports = {
  createStaffSchema,
  updateStaffSchema,
  markAttendanceSchema,
  generatePayrollSchema,
  createLoanSchema,
};
