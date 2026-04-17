'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/server/auth/session';
import { warehouseService } from '@/server/services/warehouse.service';
import { warehouseCreateSchema, warehouseUpdateSchema } from '@/server/validators/warehouses';
import { ApiError } from '@/lib/errors';

export type WarehouseFormState = { error?: string; fieldErrors?: Record<string, string[]> } | undefined;

function parseForm(formData: FormData) {
  return {
    branchId: formData.get('branchId'),
    code: formData.get('code'),
    name: formData.get('name'),
    type: formData.get('type') ?? 'MAIN',
    address: formData.get('address') ?? '',
    isActive: formData.get('isActive') !== 'off',
  };
}

export async function createWarehouseAction(_prev: WarehouseFormState, formData: FormData): Promise<WarehouseFormState> {
  const parsed = warehouseCreateSchema.safeParse(parseForm(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await warehouseService.create(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/warehouse');
  redirect('/warehouse');
}

export async function updateWarehouseAction(_prev: WarehouseFormState, formData: FormData): Promise<WarehouseFormState> {
  const parsed = warehouseUpdateSchema.safeParse({ id: formData.get('id'), ...parseForm(formData) });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await warehouseService.update(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/warehouse');
  redirect('/warehouse');
}
