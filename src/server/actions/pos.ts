'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/server/auth/session';
import { posService } from '@/server/services/pos.service';
import {
  openSessionSchema,
  closeSessionSchema,
  createSaleSchema,
  refundSaleSchema,
} from '@/server/validators/pos';
import { ApiError } from '@/lib/errors';

export type ActionState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean; saleId?: string }
  | undefined;

export async function openPosSessionAction(formData: FormData): Promise<ActionState> {
  const parsed = openSessionSchema.safeParse({
    branchId: formData.get('branchId'),
    warehouseId: formData.get('warehouseId'),
    openingFloat: formData.get('openingFloat') ?? 0,
    notes: formData.get('notes') ?? '',
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await posService.openSession(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/pos');
  redirect('/pos');
}

export async function closePosSessionAction(formData: FormData): Promise<ActionState> {
  const parsed = closeSessionSchema.safeParse({
    sessionId: formData.get('sessionId'),
    countedCash: formData.get('countedCash') ?? 0,
    notes: formData.get('notes') ?? '',
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await posService.closeSession(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/pos');
  revalidatePath('/pos/sessions');
  redirect('/pos/sessions');
}

export async function createSaleAction(input: unknown) {
  const parsed = createSaleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const session = await getSession();
    const sale = await posService.createSale(session, parsed.data);
    revalidatePath('/pos');
    revalidatePath('/pos/sales');
    return { success: true, saleId: sale.id, saleNumber: sale.number };
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
}

export async function refundSaleAction(input: unknown) {
  const parsed = refundSaleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const session = await getSession();
    const ret = await posService.refundSale(session, parsed.data);
    revalidatePath('/pos/sales');
    revalidatePath(`/pos/sales/${parsed.data.saleId}`);
    return { success: true, returnId: ret.id, returnNumber: ret.number };
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
}
