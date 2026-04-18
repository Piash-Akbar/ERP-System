'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/server/auth/session';
import { accountsService } from '@/server/services/accounts.service';
import {
  journalCreateSchema,
  journalVoidSchema,
  periodCreateSchema,
  periodStatusSchema,
  type JournalCreateInput,
} from '@/server/validators/accounts';
import { ApiError } from '@/lib/errors';

export type JournalFormState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean; entryId?: string }
  | undefined;

export async function createJournalAction(
  _prev: JournalFormState,
  formData: FormData,
): Promise<JournalFormState> {
  const raw = formData.get('payload');
  if (typeof raw !== 'string') return { error: 'Missing payload' };
  let parsed;
  try {
    const obj = JSON.parse(raw) as JournalCreateInput;
    parsed = journalCreateSchema.safeParse(obj);
  } catch {
    return { error: 'Invalid payload' };
  }
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const session = await getSession();
    const entry = await accountsService.postJournal(session, parsed.data);
    revalidatePath('/accounts/journals');
    return { success: true, entryId: entry.id };
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
}

export async function postDraftAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const session = await getSession();
  try {
    await accountsService.postDraft(session, id);
  } catch (e) {
    if (e instanceof ApiError) return;
    throw e;
  }
  revalidatePath('/accounts/journals');
  revalidatePath(`/accounts/journals/${id}`);
}

export async function voidEntryAction(formData: FormData) {
  const parsed = journalVoidSchema.safeParse({
    id: formData.get('id'),
    reason: formData.get('reason'),
  });
  if (!parsed.success) return;
  const session = await getSession();
  try {
    await accountsService.voidEntry(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return;
    throw e;
  }
  revalidatePath('/accounts/journals');
  revalidatePath(`/accounts/journals/${parsed.data.id}`);
  redirect(`/accounts/journals/${parsed.data.id}`);
}

export type PeriodFormState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean }
  | undefined;

export async function createPeriodAction(
  _prev: PeriodFormState,
  formData: FormData,
): Promise<PeriodFormState> {
  const parsed = periodCreateSchema.safeParse({
    branchId: formData.get('branchId'),
    name: formData.get('name'),
    startsAt: formData.get('startsAt'),
    endsAt: formData.get('endsAt'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const session = await getSession();
    await accountsService.createPeriod(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/accounts/periods');
  return { success: true };
}

export async function setPeriodStatusAction(formData: FormData) {
  const parsed = periodStatusSchema.safeParse({
    id: formData.get('id'),
    status: formData.get('status'),
  });
  if (!parsed.success) return;
  const session = await getSession();
  try {
    await accountsService.setPeriodStatus(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return;
    throw e;
  }
  revalidatePath('/accounts/periods');
}
