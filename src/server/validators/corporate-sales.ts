import { z } from 'zod';
import { POS_PAYMENT_METHODS } from './pos';

export { POS_PAYMENT_METHODS as CORP_PAYMENT_METHODS };

export const CORP_DISCOUNT_APPROVAL_THRESHOLD = 25;

export const PAYMENT_TERMS = [
  'COD',
  'NET_15',
  'NET_30',
  'NET_45',
  'NET_60',
  'NET_90',
] as const;

const docItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.coerce.number().gt(0),
  unitPrice: z.coerce.number().min(0),
  discountRate: z.coerce.number().min(0).max(100).default(0),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  description: z.string().trim().max(200).optional().or(z.literal('')),
});

export const createQuoteSchema = z.object({
  branchId: z.string().cuid(),
  customerId: z.string().cuid(),
  validUntil: z.coerce.date().optional(),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  items: z.array(docItemSchema).min(1),
});
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;

export const updateQuoteStatusSchema = z.object({
  quoteId: z.string().cuid(),
  status: z.enum(['SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']),
  rejectReason: z.string().trim().max(500).optional().or(z.literal('')),
});
export type UpdateQuoteStatusInput = z.infer<typeof updateQuoteStatusSchema>;

export const convertQuoteSchema = z.object({
  quoteId: z.string().cuid(),
  warehouseId: z.string().cuid(),
  paymentTerms: z.enum(PAYMENT_TERMS).default('NET_30'),
  expectedDate: z.coerce.date().optional(),
});
export type ConvertQuoteInput = z.infer<typeof convertQuoteSchema>;

export const createOrderSchema = z.object({
  branchId: z.string().cuid(),
  warehouseId: z.string().cuid(),
  customerId: z.string().cuid(),
  paymentTerms: z.enum(PAYMENT_TERMS).default('NET_30'),
  expectedDate: z.coerce.date().optional(),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  items: z.array(docItemSchema).min(1),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const cancelOrderSchema = z.object({
  orderId: z.string().cuid(),
  reason: z.string().trim().min(3).max(500),
});
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;

export const recordDeliverySchema = z.object({
  orderId: z.string().cuid(),
  warehouseId: z.string().cuid(),
  trackingNo: z.string().trim().max(100).optional().or(z.literal('')),
  carrier: z.string().trim().max(100).optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  items: z
    .array(
      z.object({
        orderItemId: z.string().cuid(),
        quantity: z.coerce.number().gt(0),
      }),
    )
    .min(1),
});
export type RecordDeliveryInput = z.infer<typeof recordDeliverySchema>;

export const createInvoiceSchema = z.object({
  orderId: z.string().cuid(),
  dueDate: z.coerce.date().optional(),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  /// Quantity per order item — defaults to delivered minus invoiced on the server
  items: z
    .array(
      z.object({
        orderItemId: z.string().cuid(),
        quantity: z.coerce.number().gt(0),
      }),
    )
    .min(1),
});
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const recordInvoicePaymentSchema = z.object({
  invoiceId: z.string().cuid(),
  method: z.enum(POS_PAYMENT_METHODS),
  amount: z.coerce.number().gt(0),
  reference: z.string().trim().max(100).optional().or(z.literal('')),
  paidAt: z.coerce.date().optional(),
});
export type RecordInvoicePaymentInput = z.infer<typeof recordInvoicePaymentSchema>;
