import { z } from 'zod';

// ─── Trade Order ──────────────────────────────────────────────────────────────

const tradeOrderItemSchema = z.object({
  productId: z.string().cuid().optional().or(z.literal('')),
  description: z.string().trim().min(1).max(500),
  hsCode: z.string().trim().max(20).optional().or(z.literal('')),
  quantity: z.coerce.number().gt(0),
  unit: z.string().trim().max(20).default('PCS'),
  unitPrice: z.coerce.number().min(0),
});

export const createTradeOrderSchema = z.object({
  branchId: z.string().cuid(),
  type: z.enum(['EXPORT', 'IMPORT']),
  customerId: z.string().cuid().optional().or(z.literal('')),
  supplierId: z.string().cuid().optional().or(z.literal('')),
  contractRef: z.string().trim().max(100).optional().or(z.literal('')),
  currency: z.enum(['BDT', 'INR', 'USD', 'EUR']).default('USD'),
  exchangeRate: z.coerce.number().gt(0).default(1),
  portOfLoading: z.string().trim().max(100).optional().or(z.literal('')),
  portOfDischarge: z.string().trim().max(100).optional().or(z.literal('')),
  incoterms: z.string().trim().max(10).optional().or(z.literal('')),
  latestShipDate: z.coerce.date().optional(),
  expectedArrival: z.coerce.date().optional(),
  goodsDescription: z.string().trim().max(1000).optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  items: z.array(tradeOrderItemSchema).min(1, 'At least one line item is required'),
}).refine(
  (d) => (d.type === 'EXPORT' ? !!d.customerId : !!d.supplierId),
  { message: 'Export orders need a customer; import orders need a supplier' },
);
export type CreateTradeOrderInput = z.infer<typeof createTradeOrderSchema>;

export const updateTradeOrderStatusSchema = z.object({
  orderId: z.string().cuid(),
  status: z.enum([
    'DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'READY_TO_SHIP',
    'SHIPPED', 'AT_CUSTOMS', 'DELIVERED', 'COMPLETED', 'CANCELLED',
  ]),
  note: z.string().trim().max(500).optional(),
});
export type UpdateTradeOrderStatusInput = z.infer<typeof updateTradeOrderStatusSchema>;

// ─── Trade Shipment ───────────────────────────────────────────────────────────

export const createShipmentSchema = z.object({
  tradeOrderId: z.string().cuid(),
  carrierName: z.string().trim().max(100).optional().or(z.literal('')),
  vesselName: z.string().trim().max(100).optional().or(z.literal('')),
  voyageNumber: z.string().trim().max(50).optional().or(z.literal('')),
  blNumber: z.string().trim().max(100).optional().or(z.literal('')),
  blDate: z.coerce.date().optional(),
  bookingRef: z.string().trim().max(100).optional().or(z.literal('')),
  portOfLoading: z.string().trim().max(100).optional().or(z.literal('')),
  portOfDischarge: z.string().trim().max(100).optional().or(z.literal('')),
  etd: z.coerce.date().optional(),
  eta: z.coerce.date().optional(),
  actualDeparture: z.coerce.date().optional(),
  actualArrival: z.coerce.date().optional(),
  containerNumbers: z.string().trim().max(500).optional().or(z.literal('')),
  sealNumbers: z.string().trim().max(200).optional().or(z.literal('')),
  grossWeight: z.coerce.number().min(0).optional(),
  netWeight: z.coerce.number().min(0).optional(),
  volume: z.coerce.number().min(0).optional(),
  packages: z.coerce.number().int().min(0).optional(),
  freightCost: z.coerce.number().min(0).optional(),
  insuranceCost: z.coerce.number().min(0).optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});
export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;

export const updateShipmentStatusSchema = z.object({
  shipmentId: z.string().cuid(),
  status: z.enum([
    'PENDING', 'BOOKING_CONFIRMED', 'IN_TRANSIT',
    'AT_PORT', 'CUSTOMS_CLEARANCE', 'DELIVERED', 'CANCELLED',
  ]),
  customsClearedAt: z.coerce.date().optional(),
});
export type UpdateShipmentStatusInput = z.infer<typeof updateShipmentStatusSchema>;

// ─── Letter of Credit ─────────────────────────────────────────────────────────

export const createLCSchema = z.object({
  tradeOrderId: z.string().cuid(),
  branchId: z.string().cuid(),
  type: z.enum(['SIGHT', 'USANCE', 'RED_CLAUSE', 'REVOLVING', 'STANDBY', 'TRANSFERABLE']).default('SIGHT'),
  paymentMode: z.enum([
    'AT_SIGHT', 'USANCE_30', 'USANCE_60', 'USANCE_90',
    'USANCE_120', 'USANCE_180', 'DEFERRED',
  ]).default('AT_SIGHT'),
  applicantName: z.string().trim().min(1).max(200),
  beneficiaryName: z.string().trim().min(1).max(200),
  issuingBank: z.string().trim().min(1).max(200),
  issuingBankSwift: z.string().trim().max(20).optional().or(z.literal('')),
  advisingBank: z.string().trim().max(200).optional().or(z.literal('')),
  advisingBankSwift: z.string().trim().max(20).optional().or(z.literal('')),
  confirmingBank: z.string().trim().max(200).optional().or(z.literal('')),
  currency: z.enum(['BDT', 'INR', 'USD', 'EUR']).default('USD'),
  lcAmount: z.coerce.number().gt(0),
  tolerancePlus: z.coerce.number().min(0).max(10).default(0),
  toleranceMinus: z.coerce.number().min(0).max(10).default(0),
  issueDate: z.coerce.date(),
  expiryDate: z.coerce.date(),
  expiryPlace: z.string().trim().max(100).optional().or(z.literal('')),
  latestShipDate: z.coerce.date().optional(),
  presentationDays: z.coerce.number().int().min(1).max(45).default(21),
  partialShipment: z.boolean().default(false),
  transhipmentAllowed: z.boolean().default(false),
  portOfLoading: z.string().trim().max(100).optional().or(z.literal('')),
  portOfDischarge: z.string().trim().max(100).optional().or(z.literal('')),
  goodsDescription: z.string().trim().max(1000).optional().or(z.literal('')),
  specialConditions: z.string().trim().max(2000).optional().or(z.literal('')),
  swiftMt700Ref: z.string().trim().max(50).optional().or(z.literal('')),
}).refine((d) => d.expiryDate > d.issueDate, {
  message: 'Expiry date must be after issue date',
  path: ['expiryDate'],
});
export type CreateLCInput = z.infer<typeof createLCSchema>;

export const updateLCStatusSchema = z.object({
  lcId: z.string().cuid(),
  status: z.enum([
    'DRAFT', 'ISSUED', 'ADVISED', 'CONFIRMED',
    'ACTIVE', 'EXPIRED', 'CLOSED', 'CANCELLED',
  ]),
});
export type UpdateLCStatusInput = z.infer<typeof updateLCStatusSchema>;

// ─── LC Amendment ─────────────────────────────────────────────────────────────

export const createLCAmendmentSchema = z.object({
  lcId: z.string().cuid(),
  newExpiryDate: z.coerce.date().optional(),
  newLcAmount: z.coerce.number().gt(0).optional(),
  newLatestShipDate: z.coerce.date().optional(),
  newSpecialConditions: z.string().trim().max(2000).optional().or(z.literal('')),
  reason: z.string().trim().min(5).max(1000),
}).refine(
  (d) => d.newExpiryDate || d.newLcAmount || d.newLatestShipDate || d.newSpecialConditions,
  { message: 'At least one field must be amended' },
);
export type CreateLCAmendmentInput = z.infer<typeof createLCAmendmentSchema>;

export const amendmentDecisionSchema = z.object({
  amendmentId: z.string().cuid(),
  decision: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().trim().max(500).optional().or(z.literal('')),
});
export type AmendmentDecisionInput = z.infer<typeof amendmentDecisionSchema>;

// ─── LC Drawdown ──────────────────────────────────────────────────────────────

export const createLCDrawdownSchema = z.object({
  lcId: z.string().cuid(),
  presentationDate: z.coerce.date(),
  amount: z.coerce.number().gt(0),
  commercialInvoiceRef: z.string().trim().max(100).optional().or(z.literal('')),
  blRef: z.string().trim().max(100).optional().or(z.literal('')),
  packingListRef: z.string().trim().max(100).optional().or(z.literal('')),
  certificateOfOrigin: z.boolean().default(false),
  inspectionCert: z.boolean().default(false),
  otherDocs: z.string().trim().max(500).optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});
export type CreateLCDrawdownInput = z.infer<typeof createLCDrawdownSchema>;

export const drawdownDecisionSchema = z.object({
  drawdownId: z.string().cuid(),
  decision: z.enum(['DOCUMENTS_ACCEPTED', 'REJECTED']),
  discrepancyNote: z.string().trim().max(1000).optional().or(z.literal('')),
  paymentDueDate: z.coerce.date().optional(),
});
export type DrawdownDecisionInput = z.infer<typeof drawdownDecisionSchema>;

export const recordDrawdownPaymentSchema = z.object({
  drawdownId: z.string().cuid(),
  paymentReceivedAt: z.coerce.date(),
  bankCharges: z.coerce.number().min(0).default(0),
});
export type RecordDrawdownPaymentInput = z.infer<typeof recordDrawdownPaymentSchema>;

// ─── Trade Payment ────────────────────────────────────────────────────────────

export const createTradePaymentSchema = z.object({
  tradeOrderId: z.string().cuid(),
  branchId: z.string().cuid(),
  currency: z.enum(['BDT', 'INR', 'USD', 'EUR']).default('USD'),
  amount: z.coerce.number().gt(0),
  exchangeRate: z.coerce.number().gt(0),
  bankName: z.string().trim().max(200).optional().or(z.literal('')),
  bankReference: z.string().trim().max(100).optional().or(z.literal('')),
  swiftRef: z.string().trim().max(50).optional().or(z.literal('')),
  paymentDate: z.coerce.date(),
  valueDate: z.coerce.date().optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});
export type CreateTradePaymentInput = z.infer<typeof createTradePaymentSchema>;
