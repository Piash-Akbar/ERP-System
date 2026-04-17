'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/server/auth/session';
import { stockService } from '@/server/services/stock.service';
import { receiptSchema, issueSchema, transferSchema, physicalCountSchema } from '@/server/validators/stock';
import { ApiError } from '@/lib/errors';

export type StockFormState = { error?: string; fieldErrors?: Record<string, string[]> } | undefined;

function parseItemsJson(formData: FormData) {
  const raw = String(formData.get('itemsJson') ?? '[]');
  try {
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function postReceiptAction(_prev: StockFormState, formData: FormData): Promise<StockFormState> {
  const parsed = receiptSchema.safeParse({
    branchId: formData.get('branchId'),
    warehouseId: formData.get('warehouseId'),
    refType: formData.get('refType') ?? 'MANUAL_ADJUST',
    refId: formData.get('refId') ?? '',
    note: formData.get('note') ?? '',
    items: parseItemsJson(formData),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Validation failed' };

  try {
    const session = await getSession();
    await stockService.postReceipt(session, {
      branchId: parsed.data.branchId,
      warehouseId: parsed.data.warehouseId,
      refType: parsed.data.refType,
      refId: parsed.data.refId || undefined,
      note: parsed.data.note || undefined,
      items: parsed.data.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        costPerUnit: i.costPerUnit,
        note: i.note || undefined,
      })),
    });
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }

  revalidatePath('/inventory/stock');
  revalidatePath('/inventory/ledger');
  redirect('/inventory/stock');
}

export async function postIssueAction(_prev: StockFormState, formData: FormData): Promise<StockFormState> {
  const parsed = issueSchema.safeParse({
    branchId: formData.get('branchId'),
    warehouseId: formData.get('warehouseId'),
    refType: formData.get('refType') ?? 'MANUAL_ADJUST',
    refId: formData.get('refId') ?? '',
    note: formData.get('note') ?? '',
    items: parseItemsJson(formData),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Validation failed' };

  try {
    const session = await getSession();
    await stockService.postIssue(session, {
      branchId: parsed.data.branchId,
      warehouseId: parsed.data.warehouseId,
      refType: parsed.data.refType,
      refId: parsed.data.refId || undefined,
      note: parsed.data.note || undefined,
      items: parsed.data.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        costPerUnit: i.costPerUnit,
        note: i.note || undefined,
      })),
    });
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }

  revalidatePath('/inventory/stock');
  revalidatePath('/inventory/ledger');
  redirect('/inventory/stock');
}

export async function postPhysicalCountAction(_prev: StockFormState, formData: FormData): Promise<StockFormState> {
  const parsed = physicalCountSchema.safeParse({
    branchId: formData.get('branchId'),
    warehouseId: formData.get('warehouseId'),
    note: formData.get('note') ?? '',
    items: parseItemsJson(formData),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Validation failed' };

  try {
    const session = await getSession();
    await stockService.postPhysicalCount(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }

  revalidatePath('/inventory/stock');
  revalidatePath('/inventory/ledger');
  redirect('/inventory/stock');
}

export async function postTransferAction(_prev: StockFormState, formData: FormData): Promise<StockFormState> {
  const parsed = transferSchema.safeParse({
    branchId: formData.get('branchId'),
    fromWarehouseId: formData.get('fromWarehouseId'),
    toWarehouseId: formData.get('toWarehouseId'),
    note: formData.get('note') ?? '',
    items: parseItemsJson(formData),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Validation failed' };

  try {
    const session = await getSession();
    await stockService.postTransfer(session, {
      branchId: parsed.data.branchId,
      fromWarehouseId: parsed.data.fromWarehouseId,
      toWarehouseId: parsed.data.toWarehouseId,
      note: parsed.data.note || undefined,
      items: parsed.data.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        costPerUnit: i.costPerUnit,
        note: i.note || undefined,
      })),
    });
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }

  revalidatePath('/inventory/stock');
  revalidatePath('/inventory/ledger');
  redirect('/inventory/stock');
}
