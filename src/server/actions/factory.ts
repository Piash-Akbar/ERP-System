'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/server/auth/session';
import { factoryService } from '@/server/services/factory.service';
import {
  productionOrderCreateSchema,
  productionConsumeSchema,
  productionOutputSchema,
  productionStageUpdateSchema,
  productionOrderStatusSchema,
  productionCostEntryCreateSchema,
  productionCostEntryDeleteSchema,
  productionOverheadRateSchema,
} from '@/server/validators/factory';
import { ApiError } from '@/lib/errors';

export type FactoryFormState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean }
  | undefined;

function parseJson<T>(raw: FormDataEntryValue | null, fallback: T): T {
  if (typeof raw !== 'string' || !raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function createProductionOrderAction(
  _prev: FactoryFormState,
  formData: FormData,
): Promise<FactoryFormState> {
  const parsed = productionOrderCreateSchema.safeParse({
    branchId: formData.get('branchId'),
    productId: formData.get('productId'),
    plannedQty: formData.get('plannedQty'),
    unit: formData.get('unit') ?? 'PCS',
    plannedStartDate: formData.get('plannedStartDate'),
    plannedEndDate: formData.get('plannedEndDate'),
    notes: formData.get('notes') ?? '',
    materials: parseJson(formData.get('materials'), []),
    stages: parseJson(formData.get('stages'), []),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  let orderId: string | null = null;
  try {
    const session = await getSession();
    const order = await factoryService.create(session, parsed.data);
    orderId = order.id;
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/factory');
  redirect(`/factory/${orderId}`);
}

export async function consumeMaterialsAction(
  _prev: FactoryFormState,
  formData: FormData,
): Promise<FactoryFormState> {
  const parsed = productionConsumeSchema.safeParse({
    orderId: formData.get('orderId'),
    items: parseJson(formData.get('items'), []),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await factoryService.consumeMaterials(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/factory/${parsed.data.orderId}`);
  return { success: true };
}

export async function recordOutputAction(
  _prev: FactoryFormState,
  formData: FormData,
): Promise<FactoryFormState> {
  const parsed = productionOutputSchema.safeParse({
    orderId: formData.get('orderId'),
    quantity: formData.get('quantity'),
    costPerUnit: formData.get('costPerUnit') ?? 0,
    toWarehouseId: formData.get('toWarehouseId'),
    note: formData.get('note') ?? '',
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await factoryService.recordOutput(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/factory/${parsed.data.orderId}`);
  return { success: true };
}

export async function updateStageAction(
  _prev: FactoryFormState,
  formData: FormData,
): Promise<FactoryFormState> {
  const parsed = productionStageUpdateSchema.safeParse({
    stageId: formData.get('stageId'),
    status: formData.get('status'),
    notes: formData.get('notes') ?? '',
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await factoryService.updateStage(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  const orderId = formData.get('orderId');
  if (typeof orderId === 'string') revalidatePath(`/factory/${orderId}`);
  return { success: true };
}

export async function updateOrderStatusAction(
  _prev: FactoryFormState,
  formData: FormData,
): Promise<FactoryFormState> {
  const parsed = productionOrderStatusSchema.safeParse({
    orderId: formData.get('orderId'),
    status: formData.get('status'),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await factoryService.updateStatus(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/factory/${parsed.data.orderId}`);
  revalidatePath('/factory');
  return { success: true };
}

export async function addCostEntryAction(
  _prev: FactoryFormState,
  formData: FormData,
): Promise<FactoryFormState> {
  const parsed = productionCostEntryCreateSchema.safeParse({
    orderId: formData.get('orderId'),
    type: formData.get('type'),
    description: formData.get('description'),
    hours: formData.get('hours') ?? undefined,
    rate: formData.get('rate') ?? undefined,
    amount: formData.get('amount') ?? undefined,
    note: formData.get('note') ?? '',
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await factoryService.addCostEntry(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/factory/${parsed.data.orderId}`);
  return { success: true };
}

export async function deleteCostEntryAction(
  _prev: FactoryFormState,
  formData: FormData,
): Promise<FactoryFormState> {
  const parsed = productionCostEntryDeleteSchema.safeParse({
    entryId: formData.get('entryId'),
    orderId: formData.get('orderId'),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await factoryService.deleteCostEntry(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/factory/${parsed.data.orderId}`);
  return { success: true };
}

export async function updateOverheadRateAction(
  _prev: FactoryFormState,
  formData: FormData,
): Promise<FactoryFormState> {
  const parsed = productionOverheadRateSchema.safeParse({
    orderId: formData.get('orderId'),
    overheadRate: formData.get('overheadRate'),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await factoryService.updateOverheadRate(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/factory/${parsed.data.orderId}`);
  return { success: true };
}
