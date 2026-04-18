import { z } from 'zod';

export const EMPLOYMENT_STATUSES = ['ACTIVE', 'ON_LEAVE', 'TERMINATED', 'RESIGNED'] as const;
export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY'] as const;
export const LEAVE_TYPES = ['CASUAL', 'SICK', 'EARNED', 'UNPAID', 'MATERNITY', 'OTHER'] as const;
export const LEAVE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;

export const employeeCreateSchema = z.object({
  branchId: z.string().cuid(),
  code: z.string().trim().min(1).max(32).regex(/^[A-Z0-9._-]+$/i, 'Use letters, digits, dot, dash, underscore'),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(160).optional().or(z.literal('')),
  phone: z.string().trim().max(32).optional().or(z.literal('')),
  designation: z.string().trim().max(80).optional().or(z.literal('')),
  department: z.string().trim().max(80).optional().or(z.literal('')),
  joinedAt: z.coerce.date(),
  status: z.enum(EMPLOYMENT_STATUSES).default('ACTIVE'),
  basicSalary: z.coerce.number().finite().min(0).default(0),
  houseAllowance: z.coerce.number().finite().min(0).default(0),
  transportAllowance: z.coerce.number().finite().min(0).default(0),
  medicalAllowance: z.coerce.number().finite().min(0).default(0),
  otherAllowance: z.coerce.number().finite().min(0).default(0),
  providentFund: z.coerce.number().finite().min(0).default(0),
  taxDeduction: z.coerce.number().finite().min(0).default(0),
  bankName: z.string().trim().max(80).optional().or(z.literal('')),
  bankAccount: z.string().trim().max(64).optional().or(z.literal('')),
});

export const employeeUpdateSchema = employeeCreateSchema.extend({ id: z.string().cuid() });

export const attendanceMarkSchema = z.object({
  employeeId: z.string().cuid(),
  date: z.coerce.date(),
  status: z.enum(ATTENDANCE_STATUSES),
  checkIn: z.string().optional().or(z.literal('')),
  checkOut: z.string().optional().or(z.literal('')),
  remarks: z.string().trim().max(200).optional().or(z.literal('')),
});

export const leaveCreateSchema = z
  .object({
    employeeId: z.string().cuid(),
    type: z.enum(LEAVE_TYPES),
    fromDate: z.coerce.date(),
    toDate: z.coerce.date(),
    reason: z.string().trim().max(500).optional().or(z.literal('')),
  })
  .refine((v) => v.toDate >= v.fromDate, { message: 'To date must be on/after from date' });

export const leaveDecisionSchema = z.object({
  id: z.string().cuid(),
  decision: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().trim().max(500).optional().or(z.literal('')),
});

export const payrollRunCreateSchema = z.object({
  branchId: z.string().cuid(),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM'),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

export const payrollRunActionSchema = z.object({
  id: z.string().cuid(),
});

export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;
export type AttendanceMarkInput = z.infer<typeof attendanceMarkSchema>;
export type LeaveCreateInput = z.infer<typeof leaveCreateSchema>;
export type LeaveDecisionInput = z.infer<typeof leaveDecisionSchema>;
export type PayrollRunCreateInput = z.infer<typeof payrollRunCreateSchema>;
