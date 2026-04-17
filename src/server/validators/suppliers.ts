import { z } from 'zod';

export const PAYMENT_TERMS = [
  'COD',
  'NET_15',
  'NET_30',
  'NET_45',
  'NET_60',
  'NET_90',
] as const;

export const SUPPLIER_STATUS = ['ACTIVE', 'INACTIVE', 'BLOCKED'] as const;

export const CURRENCY_CODES = ['BDT', 'INR', 'USD', 'EUR'] as const;

const baseSupplier = {
  branchId: z.string().cuid(),
  name: z.string().trim().min(1, 'Name is required').max(120),
  contactPerson: z.string().trim().max(120).optional().or(z.literal('')),
  phone: z.string().trim().max(32).optional().or(z.literal('')),
  email: z.string().trim().email('Invalid email').max(120).optional().or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  country: z.string().trim().max(80).optional().or(z.literal('')),
  taxId: z.string().trim().max(60).optional().or(z.literal('')),
  paymentTerms: z.enum(PAYMENT_TERMS).default('NET_30'),
  currency: z.enum(CURRENCY_CODES).default('BDT'),
  openingBalance: z.coerce.number().min(0).default(0),
  status: z.enum(SUPPLIER_STATUS).default('ACTIVE'),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
};

export const supplierCreateSchema = z.object(baseSupplier);

export const supplierUpdateSchema = z.object({
  id: z.string().cuid(),
  ...baseSupplier,
});

export type SupplierCreateInput = z.infer<typeof supplierCreateSchema>;
export type SupplierUpdateInput = z.infer<typeof supplierUpdateSchema>;

export const supplierPaymentSchema = z.object({
  supplierId: z.string().cuid(),
  invoiceId: z.string().cuid().optional().or(z.literal('')),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  paymentDate: z.coerce.date(),
  method: z.enum([
    'CASH',
    'BANK_TRANSFER',
    'CHEQUE',
    'WIRE_TRANSFER',
    'MOBILE_BANKING',
    'OTHER',
  ]),
  reference: z.string().trim().max(120).optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});
export type SupplierPaymentInput = z.infer<typeof supplierPaymentSchema>;
