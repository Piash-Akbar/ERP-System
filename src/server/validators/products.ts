import { z } from 'zod';

const decimal = (max = 18, min = 0) =>
  z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === 'string' ? v.trim() : String(v)))
    .refine((v) => v === '' || /^-?\d+(\.\d+)?$/.test(v), { message: 'Must be a number' })
    .transform((v) => (v === '' ? '0' : v))
    .refine((v) => Number(v) >= min, { message: `Must be ≥ ${min}` })
    .refine((v) => v.replace('-', '').replace('.', '').length <= max, { message: 'Too many digits' });

export const productCreateSchema = z.object({
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .min(1)
    .max(64)
    .regex(/^[A-Z0-9._-]+$/, 'SKU: A–Z, 0–9, . _ -'),
  barcode: z.string().trim().max(64).optional().or(z.literal('')),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  type: z.enum(['RAW_MATERIAL', 'WORK_IN_PROGRESS', 'FINISHED_GOOD', 'CONSUMABLE', 'SERVICE']),
  unit: z.enum(['PCS', 'KG', 'G', 'M', 'M2', 'L', 'ML', 'BOX', 'PACK', 'PAIR', 'SET']),
  categoryId: z.string().cuid().optional().or(z.literal('')),
  brandId: z.string().cuid().optional().or(z.literal('')),
  costPrice: decimal(),
  sellPrice: decimal(),
  taxRate: decimal(7),
  reorderLevel: decimal(),
  reorderQty: decimal(),
  isActive: z.boolean().default(true),
  imageUrl: z.string().trim().url().optional().or(z.literal('')),
});

export const productUpdateSchema = productCreateSchema.extend({
  id: z.string().cuid(),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
