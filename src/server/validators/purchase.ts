import { z } from 'zod';

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

export const PRIORITY = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

// ─── Purchase Requisition ────────────────────────────────────────────────────

export const requisitionItemSchema = z.object({
  productId: z.string().cuid().optional().or(z.literal('')),
  productName: z.string().trim().min(1, 'Product name required').max(120),
  unit: z.enum(UNITS).default('PCS'),
  quantity: z.coerce.number().positive('Quantity must be greater than zero'),
  estimatedPrice: z.coerce.number().min(0).default(0),
  note: z.string().trim().max(240).optional().or(z.literal('')),
});

export const requisitionCreateSchema = z.object({
  branchId: z.string().cuid(),
  department: z.string().trim().min(1, 'Department required').max(80),
  requestedBy: z.string().trim().min(1, 'Requested by required').max(120),
  priority: z.enum(PRIORITY).default('MEDIUM'),
  requiredDate: z.coerce.date(),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  items: z.array(requisitionItemSchema).min(1, 'Add at least one item'),
});

export type RequisitionCreateInput = z.infer<typeof requisitionCreateSchema>;

export const requisitionDecisionSchema = z.object({
  id: z.string().cuid(),
  decision: z.enum(['APPROVE', 'REJECT']),
  reason: z.string().trim().max(500).optional().or(z.literal('')),
});
export type RequisitionDecisionInput = z.infer<typeof requisitionDecisionSchema>;

// ─── Purchase Order ──────────────────────────────────────────────────────────

export const poItemSchema = z.object({
  productId: z.string().cuid('Select a product'),
  description: z.string().trim().max(240).optional().or(z.literal('')),
  unit: z.enum(UNITS).default('PCS'),
  orderedQty: z.coerce.number().positive('Quantity must be greater than zero'),
  unitPrice: z.coerce.number().min(0, 'Price must be zero or greater'),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  discountRate: z.coerce.number().min(0).max(100).default(0),
});

export const poCreateSchema = z.object({
  branchId: z.string().cuid(),
  supplierId: z.string().cuid('Select a supplier'),
  requisitionId: z.string().cuid().optional().or(z.literal('')),
  deliveryDate: z.coerce.date(),
  orderDate: z.coerce.date().optional(),
  currency: z.enum(['BDT', 'INR', 'USD', 'EUR']).default('BDT'),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  items: z.array(poItemSchema).min(1, 'Add at least one line item'),
});
export type PurchaseOrderCreateInput = z.infer<typeof poCreateSchema>;

export const poApproveSchema = z.object({
  id: z.string().cuid(),
});

// ─── GRN ─────────────────────────────────────────────────────────────────────

export const grnItemSchema = z.object({
  purchaseOrderItemId: z.string().cuid(),
  productId: z.string().cuid(),
  receivedQty: z.coerce.number().min(0),
  rejectedQty: z.coerce.number().min(0).default(0),
  unitCost: z.coerce.number().min(0),
  note: z.string().trim().max(240).optional().or(z.literal('')),
});

export const grnCreateSchema = z.object({
  purchaseOrderId: z.string().cuid(),
  warehouseId: z.string().cuid(),
  receivedDate: z.coerce.date(),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  items: z
    .array(grnItemSchema)
    .min(1, 'At least one line must be received'),
});
export type GrnCreateInput = z.infer<typeof grnCreateSchema>;

// ─── Purchase Invoice ────────────────────────────────────────────────────────

export const invoiceItemSchema = z.object({
  productId: z.string().cuid(),
  description: z.string().trim().max(240).optional().or(z.literal('')),
  unit: z.enum(UNITS).default('PCS'),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0),
  taxRate: z.coerce.number().min(0).max(100).default(0),
});

export const invoiceCreateSchema = z.object({
  branchId: z.string().cuid(),
  supplierId: z.string().cuid(),
  purchaseOrderId: z.string().cuid().optional().or(z.literal('')),
  grnId: z.string().cuid().optional().or(z.literal('')),
  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  currency: z.enum(['BDT', 'INR', 'USD', 'EUR']).default('BDT'),
  discountTotal: z.coerce.number().min(0).default(0),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  items: z.array(invoiceItemSchema).min(1, 'Add at least one line item'),
});
export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>;
