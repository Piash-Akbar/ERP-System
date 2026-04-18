'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/server/auth/session';
import { wholesaleService } from '@/server/services/wholesale.service';
import {
  createInvoiceSchema,
  recordPaymentSchema,
  returnInvoiceSchema,
  voidInvoiceSchema,
} from '@/server/validators/wholesale';
import { ApiError } from '@/lib/errors';

export async function createWholesaleInvoiceAction(input: unknown) {
  const parsed = createInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const session = await getSession();
    const inv = await wholesaleService.createInvoice(session, parsed.data);
    revalidatePath('/wholesale');
    revalidatePath('/wholesale/invoices');
    return { success: true, invoiceId: inv.id, invoiceNumber: inv.number };
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
}

export async function recordWholesalePaymentAction(input: unknown) {
  const parsed = recordPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const session = await getSession();
    const p = await wholesaleService.recordPayment(session, parsed.data);
    revalidatePath(`/wholesale/invoices/${parsed.data.invoiceId}`);
    revalidatePath('/wholesale/invoices');
    return { success: true, paymentId: p.id };
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
}

export async function returnWholesaleInvoiceAction(input: unknown) {
  const parsed = returnInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const session = await getSession();
    const ret = await wholesaleService.returnInvoice(session, parsed.data);
    revalidatePath(`/wholesale/invoices/${parsed.data.invoiceId}`);
    revalidatePath('/wholesale/invoices');
    return { success: true, returnId: ret.id, returnNumber: ret.number };
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
}

export async function voidWholesaleInvoiceAction(input: unknown) {
  const parsed = voidInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const session = await getSession();
    await wholesaleService.voidInvoice(session, parsed.data);
    revalidatePath(`/wholesale/invoices/${parsed.data.invoiceId}`);
    revalidatePath('/wholesale/invoices');
    return { success: true };
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
}
