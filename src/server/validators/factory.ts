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

export const PRODUCTION_MATERIAL_TYPES = ['LEATHER', 'ACCESSORY', 'OTHER'] as const;

const materialSchema = z.object({
  productId: z.string().cuid(),
  unit: z.enum(UNITS).default('PCS'),
  plannedQty: z.coerce.number().positive('Planned qty must be > 0'),
  unitCost: z.coerce.number().min(0).optional(),
  materialType: z.enum(PRODUCTION_MATERIAL_TYPES).default('OTHER'),
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
  buyerName: z.string().trim().max(200).optional().or(z.literal('')),
  batchName: z.string().trim().max(200).optional().or(z.literal('')),
  saleAmount: z.coerce.number().min(0).optional(),
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

export const PRODUCTION_COST_TYPES = ['OVERHEAD', 'WEDGE', 'LABOUR'] as const;

export const productionCostEntryCreateSchema = z
  .object({
    orderId: z.string().cuid(),
    type: z.enum(PRODUCTION_COST_TYPES),
    description: z.string().trim().min(1).max(255),
    hours: z.coerce.number().positive().optional(),
    rate: z.coerce.number().min(0).optional(),
    amount: z.coerce.number().min(0).optional(),
    note: z.string().trim().max(500).optional().or(z.literal('')),
  })
  .superRefine((val, ctx) => {
    if (val.type === 'LABOUR') {
      if (!val.hours || !val.rate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Hours and rate are required for labour entries',
          path: ['hours'],
        });
      }
    } else {
      if (val.amount === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Amount is required',
          path: ['amount'],
        });
      }
    }
  });
export type ProductionCostEntryCreateInput = z.infer<typeof productionCostEntryCreateSchema>;

export const productionCostEntryDeleteSchema = z.object({
  entryId: z.string().cuid(),
  orderId: z.string().cuid(),
});
export type ProductionCostEntryDeleteInput = z.infer<typeof productionCostEntryDeleteSchema>;

export const productionOverheadRateSchema = z.object({
  orderId: z.string().cuid(),
  overheadRate: z.coerce.number().min(0, 'Rate cannot be negative').max(100, 'Rate cannot exceed 100%'),
});
export type ProductionOverheadRateInput = z.infer<typeof productionOverheadRateSchema>;
