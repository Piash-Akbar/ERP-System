import { z } from 'zod';

export const POS_PAYMENT_METHODS = [
  'CASH',
  'CARD',
  'MOBILE_BANKING',
  'BANK_TRANSFER',
  'CREDIT',
  'GIFT_CARD',
  'OTHER',
] as const;

/**
 * Discount % above this threshold requires an `pos:discount-override`
 * permission (checked in the service). Line-level discount is also capped here.
 */
export const POS_DISCOUNT_APPROVAL_THRESHOLD = 20;

export const openSessionSchema = z.object({
  branchId: z.string().cuid(),
  warehouseId: z.string().cuid(),
  openingFloat: z.coerce.number().min(0).default(0),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});
export type OpenSessionInput = z.infer<typeof openSessionSchema>;

export const closeSessionSchema = z.object({
  sessionId: z.string().cuid(),
  countedCash: z.coerce.number().min(0),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});
export type CloseSessionInput = z.infer<typeof closeSessionSchema>;

const saleItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.coerce.number().gt(0, 'Quantity must be > 0'),
  unitPrice: z.coerce.number().min(0),
  discountRate: z.coerce.number().min(0).max(100).default(0),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  description: z.string().trim().max(200).optional().or(z.literal('')),
});

const paymentSchema = z.object({
  method: z.enum(POS_PAYMENT_METHODS),
  amount: z.coerce.number().min(0),
  reference: z.string().trim().max(100).optional().or(z.literal('')),
});

export const createSaleSchema = z
  .object({
    branchId: z.string().cuid(),
    warehouseId: z.string().cuid(),
    sessionId: z.string().cuid().optional().or(z.literal('')),
    customerId: z.string().cuid().optional().or(z.literal('')),
    items: z.array(saleItemSchema).min(1, 'At least one item is required'),
    payments: z.array(paymentSchema).min(1, 'At least one payment is required'),
    notes: z.string().trim().max(500).optional().or(z.literal('')),
  })
  .refine(
    (v) => v.payments.reduce((a, p) => a + p.amount, 0) > 0,
    { message: 'Payment total must be greater than zero', path: ['payments'] },
  );
export type CreateSaleInput = z.infer<typeof createSaleSchema>;

const returnItemSchema = z.object({
  saleItemId: z.string().cuid(),
  quantity: z.coerce.number().gt(0),
});

export const refundSaleSchema = z.object({
  saleId: z.string().cuid(),
  reason: z.string().trim().max(500).optional().or(z.literal('')),
  refundMethod: z.enum(POS_PAYMENT_METHODS).default('CASH'),
  items: z.array(returnItemSchema).min(1),
});
export type RefundSaleInput = z.infer<typeof refundSaleSchema>;
