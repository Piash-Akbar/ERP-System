import { z } from 'zod';

const qty = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === 'string' ? v.trim() : String(v)))
  .refine((v) => /^\d+(\.\d+)?$/.test(v), { message: 'Must be a positive number' })
  .refine((v) => Number(v) > 0, { message: 'Must be greater than zero' });

const cost = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === 'string' ? v.trim() : String(v)))
  .transform((v) => (v === '' ? '0' : v))
  .refine((v) => /^\d+(\.\d+)?$/.test(v), { message: 'Must be a non-negative number' });

const itemSchema = z.object({
  productId: z.string().cuid(),
  quantity: qty,
  costPerUnit: cost.optional(),
  note: z.string().trim().max(500).optional().or(z.literal('')),
});

export const receiptSchema = z.object({
  branchId: z.string().cuid(),
  warehouseId: z.string().cuid(),
  refType: z.string().trim().min(1).max(40).default('MANUAL_ADJUST'),
  refId: z.string().trim().max(80).optional().or(z.literal('')),
  note: z.string().trim().max(500).optional().or(z.literal('')),
  items: z.array(itemSchema).min(1),
});

export const issueSchema = receiptSchema;

export const transferSchema = z.object({
  branchId: z.string().cuid(),
  fromWarehouseId: z.string().cuid(),
  toWarehouseId: z.string().cuid(),
  note: z.string().trim().max(500).optional().or(z.literal('')),
  items: z.array(itemSchema).min(1),
});

const countItem = z.object({
  productId: z.string().cuid(),
  countedQuantity: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === 'string' ? v.trim() : String(v)))
    .refine((v) => /^\d+(\.\d+)?$/.test(v), { message: 'Must be a non-negative number' }),
  costPerUnit: cost.optional(),
});

export const physicalCountSchema = z.object({
  branchId: z.string().cuid(),
  warehouseId: z.string().cuid(),
  note: z.string().trim().max(500).optional().or(z.literal('')),
  items: z.array(countItem).min(1),
});

export type ReceiptForm = z.infer<typeof receiptSchema>;
export type IssueForm = z.infer<typeof issueSchema>;
export type TransferForm = z.infer<typeof transferSchema>;
export type PhysicalCountForm = z.infer<typeof physicalCountSchema>;
