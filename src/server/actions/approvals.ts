'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { approvalService } from '@/server/services/approval.service';
import {
  approvalRuleSchema,
  approvalDecisionSchema,
  approvalSubmitSchema,
} from '@/server/validators/approvals';
import { ApiError } from '@/lib/errors';

export type ApprovalFormState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean }
  | undefined;

export async function upsertApprovalRuleAction(
  _prev: ApprovalFormState,
  formData: FormData,
): Promise<ApprovalFormState> {
  const id = formData.get('id');
  const approverRolesRaw = formData.get('approverRoles');
  const approverRoles =
    typeof approverRolesRaw === 'string'
      ? approverRolesRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
  const parsed = approvalRuleSchema.safeParse({
    name: formData.get('name'),
    module: formData.get('module'),
    action: formData.get('action'),
    minAmount: formData.get('minAmount') ?? 0,
    approverRoles,
    escalateAfterHours: formData.get('escalateAfterHours') ?? 24,
    isActive: formData.get('isActive') === 'on' || formData.get('isActive') === 'true',
    description: formData.get('description') ?? '',
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await approvalService.upsertRule(
      session,
      parsed.data,
      typeof id === 'string' && id ? id : undefined,
    );
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/approvals/rules');
  return { success: true };
}

export async function submitApprovalAction(
  _prev: ApprovalFormState,
  formData: FormData,
): Promise<ApprovalFormState> {
  const parsed = approvalSubmitSchema.safeParse({
    module: formData.get('module'),
    action: formData.get('action'),
    entityType: formData.get('entityType'),
    entityId: formData.get('entityId'),
    title: formData.get('title'),
    summary: formData.get('summary') ?? '',
    amount: formData.get('amount') || undefined,
    currency: formData.get('currency') || undefined,
    branchId: formData.get('branchId') ?? '',
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  let requestId: string | null = null;
  try {
    const session = await getSession();
    const req = await approvalService.submit(session, parsed.data);
    requestId = req.id;
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/approvals');
  redirect(`/approvals/${requestId}`);
}

async function decisionAction(
  formData: FormData,
  kind: 'approve' | 'reject' | 'changes' | 'cancel',
): Promise<ApprovalFormState> {
  const parsed = approvalDecisionSchema.safeParse({
    requestId: formData.get('requestId'),
    note: formData.get('note') ?? '',
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    const svc = approvalService;
    if (kind === 'approve') await svc.approve(session, parsed.data);
    else if (kind === 'reject') await svc.reject(session, parsed.data);
    else if (kind === 'changes') await svc.requestChanges(session, parsed.data);
    else await svc.cancel(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/approvals/${parsed.data.requestId}`);
  revalidatePath('/approvals');
  return { success: true };
}

export async function approveAction(_prev: ApprovalFormState, fd: FormData) {
  return decisionAction(fd, 'approve');
}
export async function rejectAction(_prev: ApprovalFormState, fd: FormData) {
  return decisionAction(fd, 'reject');
}
export async function requestChangesAction(_prev: ApprovalFormState, fd: FormData) {
  return decisionAction(fd, 'changes');
}
export async function cancelApprovalAction(_prev: ApprovalFormState, fd: FormData) {
  return decisionAction(fd, 'cancel');
}
