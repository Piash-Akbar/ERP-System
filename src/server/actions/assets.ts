'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/server/auth/session';
import { assetService } from '@/server/services/asset.service';
import {
  assetCreateSchema,
  assetUpdateSchema,
  assetTransferSchema,
  assetDisposeSchema,
  assetDepreciateSchema,
  assetDepreciateBulkSchema,
  assetCategorySchema,
} from '@/server/validators/assets';
import { ApiError } from '@/lib/errors';

export type AssetFormState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean }
  | undefined;

function parseAsset(formData: FormData) {
  return {
    branchId: formData.get('branchId'),
    categoryId: formData.get('categoryId') ?? '',
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    serialNumber: formData.get('serialNumber') ?? '',
    location: formData.get('location') ?? '',
    assignedTo: formData.get('assignedTo') ?? '',
    condition: formData.get('condition') ?? 'GOOD',
    status: formData.get('status') ?? 'IN_USE',
    purchaseDate: formData.get('purchaseDate'),
    purchaseCost: formData.get('purchaseCost'),
    salvageValue: formData.get('salvageValue') ?? 0,
    usefulLifeMonths: formData.get('usefulLifeMonths') ?? 60,
    depreciationMethod: formData.get('depreciationMethod') ?? 'STRAIGHT_LINE',
    notes: formData.get('notes') ?? '',
  };
}

export async function createAssetAction(
  _prev: AssetFormState,
  formData: FormData,
): Promise<AssetFormState> {
  const parsed = assetCreateSchema.safeParse(parseAsset(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  let id: string | null = null;
  try {
    const session = await getSession();
    const a = await assetService.create(session, parsed.data);
    id = a.id;
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/assets');
  redirect(`/assets/${id}`);
}

export async function updateAssetAction(
  _prev: AssetFormState,
  formData: FormData,
): Promise<AssetFormState> {
  const parsed = assetUpdateSchema.safeParse({
    id: formData.get('id'),
    ...parseAsset(formData),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await assetService.update(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/assets/${parsed.data.id}`);
  redirect(`/assets/${parsed.data.id}`);
}

export async function transferAssetAction(
  _prev: AssetFormState,
  formData: FormData,
): Promise<AssetFormState> {
  const parsed = assetTransferSchema.safeParse({
    assetId: formData.get('assetId'),
    toBranchId: formData.get('toBranchId') ?? '',
    toLocation: formData.get('toLocation') ?? '',
    toAssignee: formData.get('toAssignee') ?? '',
    note: formData.get('note') ?? '',
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await assetService.transfer(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/assets/${parsed.data.assetId}`);
  return { success: true };
}

export async function disposeAssetAction(
  _prev: AssetFormState,
  formData: FormData,
): Promise<AssetFormState> {
  const parsed = assetDisposeSchema.safeParse({
    assetId: formData.get('assetId'),
    disposalValue: formData.get('disposalValue') ?? 0,
    disposalReason: formData.get('disposalReason'),
    disposedAt: formData.get('disposedAt'),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await assetService.dispose(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/assets/${parsed.data.assetId}`);
  revalidatePath('/assets');
  return { success: true };
}

export async function depreciateAssetAction(
  _prev: AssetFormState,
  formData: FormData,
): Promise<AssetFormState> {
  const parsed = assetDepreciateSchema.safeParse({
    assetId: formData.get('assetId'),
    periodEnd: formData.get('periodEnd'),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await assetService.depreciate(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/assets/${parsed.data.assetId}`);
  return { success: true };
}

export async function depreciateBulkAction(
  _prev: AssetFormState,
  formData: FormData,
): Promise<AssetFormState> {
  const parsed = assetDepreciateBulkSchema.safeParse({
    branchId: formData.get('branchId') ?? '',
    periodEnd: formData.get('periodEnd'),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await assetService.depreciateBulk(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/assets');
  return { success: true };
}

export async function upsertAssetCategoryAction(
  _prev: AssetFormState,
  formData: FormData,
): Promise<AssetFormState> {
  const id = formData.get('id');
  const parsed = assetCategorySchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    depreciationMethod: formData.get('depreciationMethod') ?? 'STRAIGHT_LINE',
    defaultLifeMonths: formData.get('defaultLifeMonths') ?? 60,
    defaultSalvageRate: formData.get('defaultSalvageRate') ?? 0,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await assetService.upsertCategory(
      session,
      parsed.data,
      typeof id === 'string' && id ? id : undefined,
    );
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/assets/categories');
  return { success: true };
}
