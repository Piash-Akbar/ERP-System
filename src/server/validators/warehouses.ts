import { z } from 'zod';

export const warehouseCreateSchema = z.object({
  branchId: z.string().cuid(),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1)
    .max(16)
    .regex(/^[A-Z0-9_-]+$/, 'A–Z, 0–9, _ or -'),
  name: z.string().trim().min(1).max(120),
  type: z.enum(['MAIN', 'STORE', 'WIP', 'QUARANTINE', 'DAMAGED', 'SHOWROOM']),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export const warehouseUpdateSchema = warehouseCreateSchema.extend({
  id: z.string().cuid(),
});

export type WarehouseCreateInput = z.infer<typeof warehouseCreateSchema>;
export type WarehouseUpdateInput = z.infer<typeof warehouseUpdateSchema>;
