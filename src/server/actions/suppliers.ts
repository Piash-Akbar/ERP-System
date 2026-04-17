'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/server/auth/session';
import { supplierService } from '@/server/services/supplier.service';
import {
  supplierCreateSchema,
  supplierUpdateSchema,
  supplierPaymentSchema,
} from '@/server/validators/suppliers';
import { ApiError } from '@/lib/errors';

export type SupplierFormState =
  | { error?: string; fieldErrors?: Record<string, string[]> }
  | undefined;

function parseSupplier(formData: FormData) {
  return {
    branchId: formData.get('branchId'),
    name: formData.get('name'),
    contactPerson: formData.get('contactPerson') ?? '',
    phone: formData.get('phone') ?? '',
    email: formData.get('email') ?? '',
    address: formData.get('address') ?? '',
    city: formData.get('city') ?? '',
    country: formData.get('country') ?? '',
    taxId: formData.get('taxId') ?? '',
    paymentTerms: formData.get('paymentTerms') ?? 'NET_30',
    currency: formData.get('currency') ?? 'BDT',
    openingBalance: formData.get('openingBalance') ?? 0,
    status: formData.get('status') ?? 'ACTIVE',
    notes: formData.get('notes') ?? '',
  };
}

export async function createSupplierAction(
  _prev: SupplierFormState,
  formData: FormData,
): Promise<SupplierFormState> {
  const parsed = supplierCreateSchema.safeParse(parseSupplier(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await supplierService.create(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/suppliers');
  redirect('/suppliers');
}

export async function updateSupplierAction(
  _prev: SupplierFormState,
  formData: FormData,
): Promise<SupplierFormState> {
  const parsed = supplierUpdateSchema.safeParse({
    id: formData.get('id'),
    ...parseSupplier(formData),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await supplierService.update(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/suppliers');
  redirect(`/suppliers/${parsed.data.id}`);
}

export type PaymentFormState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean }
  | undefined;

export async function recordSupplierPaymentAction(
  _prev: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  const parsed = supplierPaymentSchema.safeParse({
    supplierId: formData.get('supplierId'),
    invoiceId: formData.get('invoiceId') ?? '',
    amount: formData.get('amount'),
    paymentDate: formData.get('paymentDate'),
    method: formData.get('method'),
    reference: formData.get('reference') ?? '',
    notes: formData.get('notes') ?? '',
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await supplierService.recordPayment(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/suppliers');
  revalidatePath(`/suppliers/${parsed.data.supplierId}`);
  revalidatePath('/suppliers/payments');
  return { success: true };
}
