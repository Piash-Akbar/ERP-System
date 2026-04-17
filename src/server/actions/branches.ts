'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/server/auth/session';
import { branchService } from '@/server/services/branch.service';
import { branchCreateSchema, branchUpdateSchema } from '@/server/validators/branches';
import { ApiError } from '@/lib/errors';
import { ACTIVE_BRANCH_COOKIE } from '@/lib/cookies';

export type BranchFormState = { error?: string; fieldErrors?: Record<string, string[]> } | undefined;

function parseForm(formData: FormData) {
  return {
    code: formData.get('code'),
    name: formData.get('name'),
    type: formData.get('type') ?? 'MAIN',
    currency: formData.get('currency') ?? 'BDT',
    address: formData.get('address') ?? '',
    phone: formData.get('phone') ?? '',
    email: formData.get('email') ?? '',
    allowNegativeStock: formData.get('allowNegativeStock') === 'on',
    isActive: formData.get('isActive') !== 'off',
  };
}

export async function createBranchAction(_prev: BranchFormState, formData: FormData): Promise<BranchFormState> {
  const parsed = branchCreateSchema.safeParse(parseForm(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const session = await getSession();
    await branchService.create(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }

  revalidatePath('/branches');
  redirect('/branches');
}

export async function updateBranchAction(_prev: BranchFormState, formData: FormData): Promise<BranchFormState> {
  const parsed = branchUpdateSchema.safeParse({ id: formData.get('id'), ...parseForm(formData) });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const session = await getSession();
    await branchService.update(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }

  revalidatePath('/branches');
  redirect('/branches');
}

export async function setActiveBranchAction(formData: FormData) {
  const branchId = String(formData.get('branchId') ?? '');
  if (!branchId) return;
  const session = await getSession();
  if (!session) return;
  // validate the branch exists + is active
  const branch = await branchService.getById(session, branchId);
  if (!branch.isActive) return;
  const store = await cookies();
  store.set(ACTIVE_BRANCH_COOKIE, branchId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath('/', 'layout');
}
