import { z } from 'zod';

export const CUSTOMER_STATUS = ['ACTIVE', 'INACTIVE', 'BLOCKED'] as const;
export const CUSTOMER_TYPES = [
  'RETAIL',
  'WHOLESALE',
  'CORPORATE',
  'ONLINE',
  'EXPORT',
] as const;
export const CURRENCY_CODES = ['BDT', 'INR', 'USD', 'EUR'] as const;
export const INTERACTION_TYPES = [
  'CALL',
  'EMAIL',
  'MEETING',
  'NOTE',
  'COMPLAINT',
  'FOLLOW_UP',
  'OTHER',
] as const;

const baseCustomer = {
  branchId: z.string().cuid(),
  name: z.string().trim().min(1, 'Name is required').max(120),
  type: z.enum(CUSTOMER_TYPES).default('RETAIL'),
  categoryId: z.string().cuid().optional().or(z.literal('')),
  contactPerson: z.string().trim().max(120).optional().or(z.literal('')),
  phone: z.string().trim().max(32).optional().or(z.literal('')),
  email: z.string().trim().email('Invalid email').max(120).optional().or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  country: z.string().trim().max(80).optional().or(z.literal('')),
  taxId: z.string().trim().max(60).optional().or(z.literal('')),
  creditLimit: z.coerce.number().min(0).default(0),
  creditDays: z.coerce.number().int().min(0).max(365).default(0),
  currency: z.enum(CURRENCY_CODES).default('BDT'),
  openingBalance: z.coerce.number().min(0).default(0),
  status: z.enum(CUSTOMER_STATUS).default('ACTIVE'),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
};

export const customerCreateSchema = z.object(baseCustomer);
export const customerUpdateSchema = z.object({
  id: z.string().cuid(),
  ...baseCustomer,
});

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;

export const customerCategorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  discountPct: z.coerce.number().min(0).max(100).default(0),
  isActive: z.coerce.boolean().default(true),
});
export type CustomerCategoryInput = z.infer<typeof customerCategorySchema>;

export const customerInteractionSchema = z.object({
  customerId: z.string().cuid(),
  type: z.enum(INTERACTION_TYPES).default('NOTE'),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().max(2000).optional().or(z.literal('')),
  followUpAt: z.coerce.date().optional().nullable(),
});
export type CustomerInteractionInput = z.infer<typeof customerInteractionSchema>;
