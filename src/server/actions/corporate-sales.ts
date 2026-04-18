'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/server/auth/session';
import { corporateService } from '@/server/services/corporate-sales.service';
import {
  createQuoteSchema,
  updateQuoteStatusSchema,
  convertQuoteSchema,
  createOrderSchema,
  cancelOrderSchema,
  recordDeliverySchema,
  createInvoiceSchema,
  recordInvoicePaymentSchema,
} from '@/server/validators/corporate-sales';
import { ApiError } from '@/lib/errors';

function fail(e: unknown) {
  if (e instanceof ApiError) return { error: e.message };
  throw e;
}

export async function createCorporateQuoteAction(input: unknown) {
  const parsed = createQuoteSchema.safeParse(input);
  if (!parsed.success)
    return { error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    const q = await corporateService.createQuote(session, parsed.data);
    revalidatePath('/corporate-sales');
    revalidatePath('/corporate-sales/quotes');
    return { success: true, quoteId: q.id, quoteNumber: q.number };
  } catch (e) {
    return fail(e);
  }
}

export async function updateCorporateQuoteStatusAction(input: unknown) {
  const parsed = updateQuoteStatusSchema.safeParse(input);
  if (!parsed.success)
    return { error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await corporateService.updateQuoteStatus(session, parsed.data);
    revalidatePath(`/corporate-sales/quotes/${parsed.data.quoteId}`);
    revalidatePath('/corporate-sales/quotes');
    return { success: true };
  } catch (e) {
    return fail(e);
  }
}

export async function convertCorporateQuoteAction(input: unknown) {
  const parsed = convertQuoteSchema.safeParse(input);
  if (!parsed.success)
    return { error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    const o = await corporateService.convertQuoteToOrder(session, parsed.data);
    revalidatePath(`/corporate-sales/quotes/${parsed.data.quoteId}`);
    revalidatePath('/corporate-sales/orders');
    return { success: true, orderId: o.id, orderNumber: o.number };
  } catch (e) {
    return fail(e);
  }
}

export async function createCorporateOrderAction(input: unknown) {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success)
    return { error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    const o = await corporateService.createOrder(session, parsed.data);
    revalidatePath('/corporate-sales');
    revalidatePath('/corporate-sales/orders');
    return { success: true, orderId: o.id, orderNumber: o.number };
  } catch (e) {
    return fail(e);
  }
}

export async function cancelCorporateOrderAction(input: unknown) {
  const parsed = cancelOrderSchema.safeParse(input);
  if (!parsed.success)
    return { error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await corporateService.cancelOrder(session, parsed.data);
    revalidatePath(`/corporate-sales/orders/${parsed.data.orderId}`);
    return { success: true };
  } catch (e) {
    return fail(e);
  }
}

export async function recordCorporateDeliveryAction(input: unknown) {
  const parsed = recordDeliverySchema.safeParse(input);
  if (!parsed.success)
    return { error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    const d = await corporateService.recordDelivery(session, parsed.data);
    revalidatePath(`/corporate-sales/orders/${parsed.data.orderId}`);
    return { success: true, deliveryId: d.id, deliveryNumber: d.number };
  } catch (e) {
    return fail(e);
  }
}

export async function createCorporateInvoiceAction(input: unknown) {
  const parsed = createInvoiceSchema.safeParse(input);
  if (!parsed.success)
    return { error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    const inv = await corporateService.createInvoice(session, parsed.data);
    revalidatePath(`/corporate-sales/orders/${parsed.data.orderId}`);
    revalidatePath('/corporate-sales/invoices');
    return { success: true, invoiceId: inv.id, invoiceNumber: inv.number };
  } catch (e) {
    return fail(e);
  }
}

export async function recordCorporateInvoicePaymentAction(input: unknown) {
  const parsed = recordInvoicePaymentSchema.safeParse(input);
  if (!parsed.success)
    return { error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await corporateService.recordInvoicePayment(session, parsed.data);
    revalidatePath(`/corporate-sales/invoices/${parsed.data.invoiceId}`);
    revalidatePath('/corporate-sales/invoices');
    return { success: true };
  } catch (e) {
    return fail(e);
  }
}
