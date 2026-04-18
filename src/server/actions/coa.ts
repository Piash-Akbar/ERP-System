'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/server/auth/session';
import { coaService } from '@/server/services/coa.service';
import { chartAccountCreateSchema, chartAccountUpdateSchema } from '@/server/validators/coa';
import { ApiError } from '@/lib/errors';

export type CoaFormState =
  | { error?: string; fieldErrors?: Record<string, string[]> }
  | undefined;

function parseForm(formData: FormData) {
  const parentId = formData.get('parentId');
  const branchId = formData.get('branchId');
  return {
    code: String(formData.get('code') ?? '').toUpperCase(),
    name: formData.get('name'),
    type: formData.get('type'),
    normalSide: formData.get('normalSide'),
    parentId: parentId && String(parentId) ? String(parentId) : null,
    isPosting: formData.get('isPosting') !== 'off',
    isControl: formData.get('isControl') === 'on',
    currency: formData.get('currency') ?? 'BDT',
    branchId: branchId && String(branchId) ? String(branchId) : null,
    openingBalance: formData.get('openingBalance') ?? 0,
    description: formData.get('description') ?? '',
    isActive: formData.get('isActive') !== 'off',
  };
}

export async function createChartAccountAction(
  _prev: CoaFormState,
  formData: FormData,
): Promise<CoaFormState> {
  const parsed = chartAccountCreateSchema.safeParse(parseForm(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const session = await getSession();
    await coaService.create(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }

  revalidatePath('/coa');
  redirect('/coa');
}

export async function updateChartAccountAction(
  _prev: CoaFormState,
  formData: FormData,
): Promise<CoaFormState> {
  const parsed = chartAccountUpdateSchema.safeParse({ id: formData.get('id'), ...parseForm(formData) });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const session = await getSession();
    await coaService.update(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }

  revalidatePath('/coa');
  redirect('/coa');
}
