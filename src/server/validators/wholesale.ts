import { z } from 'zod';
import { POS_PAYMENT_METHODS } from './pos';

export { POS_PAYMENT_METHODS as WHOLESALE_PAYMENT_METHODS };

/**
 * Line-level discount above this threshold requires the
 * `wholesale:discount-override` permission (service-enforced).
 */
export const WHOLESALE_DISCOUNT_APPROVAL_THRESHOLD = 25;

const invoiceItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.coerce.number().gt(0, 'Quantity must be > 0'),
  unitPrice: z.coerce.number().min(0),
  discountRate: z.coerce.number().min(0).max(100).default(0),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  description: z.string().trim().max(200).optional().or(z.literal('')),
});

const paymentSchema = z.object({
  method: z.enum(POS_PAYMENT_METHODS),
  amount: z.coerce.number().gt(0),
  reference: z.string().trim().max(100).optional().or(z.literal('')),
});

export const createInvoiceSchema = z.object({
  branchId: z.string().cuid(),
  warehouseId: z.string().cuid(),
  customerId: z.string().cuid(),
  salesRepId: z.string().cuid().optional().or(z.literal('')),
  dueDate: z.coerce.date().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one line is required'),
  initialPayments: z.array(paymentSchema).default([]),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const recordPaymentSchema = z.object({
  invoiceId: z.string().cuid(),
  method: z.enum(POS_PAYMENT_METHODS),
  amount: z.coerce.number().gt(0),
  reference: z.string().trim().max(100).optional().or(z.literal('')),
  paidAt: z.coerce.date().optional(),
});
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

const returnItemSchema = z.object({
  invoiceItemId: z.string().cuid(),
  quantity: z.coerce.number().gt(0),
});

export const returnInvoiceSchema = z.object({
  invoiceId: z.string().cuid(),
  reason: z.string().trim().max(500).optional().or(z.literal('')),
  /// If true: reduce the customer's balance due; else refund via refundMethod
  refundToBalance: z.boolean().default(true),
  refundMethod: z.enum(POS_PAYMENT_METHODS).default('CASH'),
  items: z.array(returnItemSchema).min(1),
});
export type ReturnInvoiceInput = z.infer<typeof returnInvoiceSchema>;

export const voidInvoiceSchema = z.object({
  invoiceId: z.string().cuid(),
  reason: z.string().trim().min(3).max(500),
});
export type VoidInvoiceInput = z.infer<typeof voidInvoiceSchema>;
