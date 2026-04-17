import { z } from 'zod';

export const branchCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1)
    .max(16)
    .regex(/^[A-Z0-9_-]+$/, 'Only A–Z, 0–9, _ or -'),
  name: z.string().trim().min(1).max(120),
  type: z.enum(['MAIN', 'FACTORY', 'SHOWROOM', 'WAREHOUSE']).default('MAIN'),
  currency: z.enum(['BDT', 'INR', 'USD', 'EUR']).default('BDT'),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  email: z.string().trim().toLowerCase().email().optional().or(z.literal('')),
  allowNegativeStock: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const branchUpdateSchema = branchCreateSchema.extend({
  id: z.string().cuid(),
});

export type BranchCreateInput = z.infer<typeof branchCreateSchema>;
export type BranchUpdateInput = z.infer<typeof branchUpdateSchema>;
