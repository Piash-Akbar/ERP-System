import { z } from 'zod';

export const APPROVAL_STATUS = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'CHANGES_REQUESTED',
  'ESCALATED',
] as const;

export const approvalRuleSchema = z.object({
  name: z.string().trim().min(1).max(120),
  module: z.string().trim().min(1).max(60),
  action: z.string().trim().min(1).max(60),
  minAmount: z.coerce.number().min(0).default(0),
  approverRoles: z.array(z.string().trim().min(1)).min(1),
  escalateAfterHours: z.coerce.number().int().min(1).max(720).default(24),
  isActive: z.coerce.boolean().default(true),
  description: z.string().trim().max(500).optional().or(z.literal('')),
});
export type ApprovalRuleInput = z.infer<typeof approvalRuleSchema>;

export const approvalSubmitSchema = z.object({
  module: z.string().trim().min(1),
  action: z.string().trim().min(1),
  entityType: z.string().trim().min(1),
  entityId: z.string().trim().min(1),
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(1000).optional().or(z.literal('')),
  amount: z.coerce.number().min(0).optional(),
  currency: z.enum(['BDT', 'INR', 'USD', 'EUR']).optional(),
  branchId: z.string().cuid().optional().or(z.literal('')),
});
export type ApprovalSubmitInput = z.infer<typeof approvalSubmitSchema>;

export const approvalDecisionSchema = z.object({
  requestId: z.string().cuid(),
  note: z.string().trim().max(1000).optional().or(z.literal('')),
});
export type ApprovalDecisionInput = z.infer<typeof approvalDecisionSchema>;
