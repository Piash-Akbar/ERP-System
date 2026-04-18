import { z } from 'zod';

export const ASSET_STATUS = [
  'IN_USE',
  'IN_STORAGE',
  'UNDER_MAINTENANCE',
  'DISPOSED',
  'LOST',
] as const;

export const ASSET_CONDITION = ['NEW', 'GOOD', 'FAIR', 'POOR'] as const;

export const DEPRECIATION_METHODS = [
  'STRAIGHT_LINE',
  'DECLINING_BALANCE',
  'NONE',
] as const;

export const assetCategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  depreciationMethod: z.enum(DEPRECIATION_METHODS).default('STRAIGHT_LINE'),
  defaultLifeMonths: z.coerce.number().int().min(1).max(1200).default(60),
  defaultSalvageRate: z.coerce.number().min(0).max(1).default(0),
});
export type AssetCategoryInput = z.infer<typeof assetCategorySchema>;

const baseAsset = {
  branchId: z.string().cuid(),
  categoryId: z.string().cuid().optional().or(z.literal('')),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  serialNumber: z.string().trim().max(120).optional().or(z.literal('')),
  location: z.string().trim().max(160).optional().or(z.literal('')),
  assignedTo: z.string().trim().max(120).optional().or(z.literal('')),
  condition: z.enum(ASSET_CONDITION).default('GOOD'),
  status: z.enum(ASSET_STATUS).default('IN_USE'),
  purchaseDate: z.coerce.date(),
  purchaseCost: z.coerce.number().min(0),
  salvageValue: z.coerce.number().min(0).default(0),
  usefulLifeMonths: z.coerce.number().int().min(1).max(1200).default(60),
  depreciationMethod: z.enum(DEPRECIATION_METHODS).default('STRAIGHT_LINE'),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
};

export const assetCreateSchema = z.object(baseAsset);
export type AssetCreateInput = z.infer<typeof assetCreateSchema>;

export const assetUpdateSchema = z.object({ id: z.string().cuid(), ...baseAsset });
export type AssetUpdateInput = z.infer<typeof assetUpdateSchema>;

export const assetTransferSchema = z.object({
  assetId: z.string().cuid(),
  toBranchId: z.string().cuid().optional().or(z.literal('')),
  toLocation: z.string().trim().max(160).optional().or(z.literal('')),
  toAssignee: z.string().trim().max(120).optional().or(z.literal('')),
  note: z.string().trim().max(500).optional().or(z.literal('')),
});
export type AssetTransferInput = z.infer<typeof assetTransferSchema>;

export const assetDisposeSchema = z.object({
  assetId: z.string().cuid(),
  disposalValue: z.coerce.number().min(0).default(0),
  disposalReason: z.string().trim().max(500),
  disposedAt: z.coerce.date(),
});
export type AssetDisposeInput = z.infer<typeof assetDisposeSchema>;

export const assetDepreciateSchema = z.object({
  assetId: z.string().cuid(),
  periodEnd: z.coerce.date(),
});
export type AssetDepreciateInput = z.infer<typeof assetDepreciateSchema>;

export const assetDepreciateBulkSchema = z.object({
  branchId: z.string().cuid().optional().or(z.literal('')),
  periodEnd: z.coerce.date(),
});
export type AssetDepreciateBulkInput = z.infer<typeof assetDepreciateBulkSchema>;
