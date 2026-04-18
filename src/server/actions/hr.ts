'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/server/auth/session';
import { hrService } from '@/server/services/hr.service';
import {
  attendanceMarkSchema,
  employeeCreateSchema,
  employeeUpdateSchema,
  leaveCreateSchema,
  leaveDecisionSchema,
  payrollRunCreateSchema,
} from '@/server/validators/hr';
import { ApiError } from '@/lib/errors';

export type FormState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean; id?: string }
  | undefined;

function parseEmployeeForm(fd: FormData) {
  const num = (k: string) => fd.get(k) ?? 0;
  return {
    branchId: fd.get('branchId'),
    code: String(fd.get('code') ?? '').toUpperCase(),
    firstName: fd.get('firstName'),
    lastName: fd.get('lastName'),
    email: fd.get('email') ?? '',
    phone: fd.get('phone') ?? '',
    designation: fd.get('designation') ?? '',
    department: fd.get('department') ?? '',
    joinedAt: fd.get('joinedAt'),
    status: fd.get('status') ?? 'ACTIVE',
    basicSalary: num('basicSalary'),
    houseAllowance: num('houseAllowance'),
    transportAllowance: num('transportAllowance'),
    medicalAllowance: num('medicalAllowance'),
    otherAllowance: num('otherAllowance'),
    providentFund: num('providentFund'),
    taxDeduction: num('taxDeduction'),
    bankName: fd.get('bankName') ?? '',
    bankAccount: fd.get('bankAccount') ?? '',
  };
}

export async function createEmployeeAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = employeeCreateSchema.safeParse(parseEmployeeForm(fd));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await hrService.createEmployee(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/hr/employees');
  redirect('/hr/employees');
}

export async function updateEmployeeAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = employeeUpdateSchema.safeParse({ id: fd.get('id'), ...parseEmployeeForm(fd) });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await hrService.updateEmployee(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/hr/employees');
  redirect('/hr/employees');
}

export async function markAttendanceAction(fd: FormData) {
  const parsed = attendanceMarkSchema.safeParse({
    employeeId: fd.get('employeeId'),
    date: fd.get('date'),
    status: fd.get('status'),
    checkIn: fd.get('checkIn') ?? '',
    checkOut: fd.get('checkOut') ?? '',
    remarks: fd.get('remarks') ?? '',
  });
  if (!parsed.success) return;
  const session = await getSession();
  try {
    await hrService.markAttendance(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return;
    throw e;
  }
  revalidatePath('/hr/attendance');
}

export async function createLeaveAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = leaveCreateSchema.safeParse({
    employeeId: fd.get('employeeId'),
    type: fd.get('type'),
    fromDate: fd.get('fromDate'),
    toDate: fd.get('toDate'),
    reason: fd.get('reason') ?? '',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  try {
    const session = await getSession();
    await hrService.createLeave(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/hr/leaves');
  return { success: true };
}

export async function decideLeaveAction(fd: FormData) {
  const parsed = leaveDecisionSchema.safeParse({
    id: fd.get('id'),
    decision: fd.get('decision'),
    note: fd.get('note') ?? '',
  });
  if (!parsed.success) return;
  const session = await getSession();
  try {
    await hrService.decideLeave(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return;
    throw e;
  }
  revalidatePath('/hr/leaves');
}

export async function createPayrollRunAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = payrollRunCreateSchema.safeParse({
    branchId: fd.get('branchId'),
    period: fd.get('period'),
    notes: fd.get('notes') ?? '',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  try {
    const session = await getSession();
    const run = await hrService.createPayrollRun(session, parsed.data);
    revalidatePath('/hr/payroll');
    return { success: true, id: run.id };
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
}

export async function payrollStatusAction(fd: FormData) {
  const id = String(fd.get('id') ?? '');
  const action = String(fd.get('action') ?? '');
  if (!id) return;
  const session = await getSession();
  try {
    if (action === 'approve') await hrService.approvePayroll(session, id);
    else if (action === 'pay') await hrService.markPayrollPaid(session, id);
    else if (action === 'lock') await hrService.lockPayroll(session, id);
    else if (action === 'cancel') await hrService.cancelPayroll(session, id);
  } catch (e) {
    if (e instanceof ApiError) return;
    throw e;
  }
  revalidatePath('/hr/payroll');
  revalidatePath(`/hr/payroll/${id}`);
}
