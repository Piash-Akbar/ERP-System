import { z } from 'zod';

export const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'] as const;
export const NORMAL_SIDES = ['DEBIT', 'CREDIT'] as const;

export const chartAccountCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(24)
    .regex(/^[A-Z0-9._-]+$/i, 'Use letters, digits, dot, dash, underscore'),
  name: z.string().trim().min(1).max(160),
  type: z.enum(ACCOUNT_TYPES),
  normalSide: z.enum(NORMAL_SIDES),
  parentId: z.string().cuid().optional().nullable(),
  isPosting: z.boolean().default(true),
  isControl: z.boolean().default(false),
  currency: z.enum(['BDT', 'INR', 'USD', 'EUR']).default('BDT'),
  branchId: z.string().cuid().optional().nullable(),
  openingBalance: z.coerce.number().finite().default(0),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export const chartAccountUpdateSchema = chartAccountCreateSchema.extend({
  id: z.string().cuid(),
});

export type ChartAccountCreateInput = z.infer<typeof chartAccountCreateSchema>;
export type ChartAccountUpdateInput = z.infer<typeof chartAccountUpdateSchema>;
