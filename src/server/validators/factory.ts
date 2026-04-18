import { z } from 'zod';

export const PRODUCTION_ORDER_STATUS = [
  'DRAFT',
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'ON_HOLD',
] as const;

export const PRODUCTION_STAGE_STATUS = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'SKIPPED',
] as const;

export const UNITS = [
  'PCS',
  'KG',
  'G',
  'M',
  'M2',
  'L',
  'ML',
  'BOX',
  'PACK',
  'PAIR',
  'SET',
] as const;

const materialSchema = z.object({
  productId: z.string().cuid(),
  unit: z.enum(UNITS).default('PCS'),
  plannedQty: z.coerce.number().positive('Planned qty must be > 0'),
  fromWarehouseId: z.string().cuid().optional().or(z.literal('')),
  note: z.string().trim().max(300).optional().or(z.literal('')),
});

const stageSchema = z.object({
  sequence: z.coerce.number().int().min(1),
  name: z.string().trim().min(1).max(120),
  notes: z.string().trim().max(300).optional().or(z.literal('')),
});

export const productionOrderCreateSchema = z.object({
  branchId: z.string().cuid(),
  productId: z.string().cuid(),
  plannedQty: z.coerce.number().positive('Planned qty must be > 0'),
  unit: z.enum(UNITS).default('PCS'),
  plannedStartDate: z.coerce.date(),
  plannedEndDate: z.coerce.date(),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  materials: z.array(materialSchema).default([]),
  stages: z.array(stageSchema).default([]),
});
export type ProductionOrderCreateInput = z.infer<typeof productionOrderCreateSchema>;

export const productionConsumeSchema = z.object({
  orderId: z.string().cuid(),
  items: z
    .array(
      z.object({
        materialId: z.string().cuid(),
        quantity: z.coerce.number().positive('Quantity must be > 0'),
        costPerUnit: z.coerce.number().min(0).default(0),
      }),
    )
    .min(1),
});
export type ProductionConsumeInput = z.infer<typeof productionConsumeSchema>;

export const productionOutputSchema = z.object({
  orderId: z.string().cuid(),
  quantity: z.coerce.number().positive('Quantity must be > 0'),
  costPerUnit: z.coerce.number().min(0).default(0),
  toWarehouseId: z.string().cuid(),
  note: z.string().trim().max(300).optional().or(z.literal('')),
});
export type ProductionOutputInput = z.infer<typeof productionOutputSchema>;

export const productionStageUpdateSchema = z.object({
  stageId: z.string().cuid(),
  status: z.enum(PRODUCTION_STAGE_STATUS),
  notes: z.string().trim().max(300).optional().or(z.literal('')),
});
export type ProductionStageUpdateInput = z.infer<typeof productionStageUpdateSchema>;

export const productionOrderStatusSchema = z.object({
  orderId: z.string().cuid(),
  status: z.enum(PRODUCTION_ORDER_STATUS),
});
export type ProductionOrderStatusInput = z.infer<typeof productionOrderStatusSchema>;
