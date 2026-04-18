'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/server/auth/session';
import { customerService } from '@/server/services/customer.service';
import {
  customerCreateSchema,
  customerUpdateSchema,
  customerCategorySchema,
  customerInteractionSchema,
} from '@/server/validators/crm';
import { ApiError } from '@/lib/errors';

export type CustomerFormState =
  | { error?: string; fieldErrors?: Record<string, string[]> }
  | undefined;

function parseCustomer(formData: FormData) {
  return {
    branchId: formData.get('branchId'),
    name: formData.get('name'),
    type: formData.get('type') ?? 'RETAIL',
    categoryId: formData.get('categoryId') ?? '',
    contactPerson: formData.get('contactPerson') ?? '',
    phone: formData.get('phone') ?? '',
    email: formData.get('email') ?? '',
    address: formData.get('address') ?? '',
    city: formData.get('city') ?? '',
    country: formData.get('country') ?? '',
    taxId: formData.get('taxId') ?? '',
    creditLimit: formData.get('creditLimit') ?? 0,
    creditDays: formData.get('creditDays') ?? 0,
    currency: formData.get('currency') ?? 'BDT',
    openingBalance: formData.get('openingBalance') ?? 0,
    status: formData.get('status') ?? 'ACTIVE',
    notes: formData.get('notes') ?? '',
  };
}

export async function createCustomerAction(
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const parsed = customerCreateSchema.safeParse(parseCustomer(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await customerService.create(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/crm');
  redirect('/crm');
}

export async function updateCustomerAction(
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const parsed = customerUpdateSchema.safeParse({
    id: formData.get('id'),
    ...parseCustomer(formData),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await customerService.update(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/crm');
  redirect(`/crm/${parsed.data.id}`);
}

export type CategoryFormState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean }
  | undefined;

export async function createCustomerCategoryAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const parsed = customerCategorySchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    discountPct: formData.get('discountPct') ?? 0,
    isActive: formData.get('isActive') === 'false' ? false : true,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await customerService.createCategory(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/crm/categories');
  return { success: true };
}

export type InteractionFormState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean }
  | undefined;

export async function addCustomerInteractionAction(
  _prev: InteractionFormState,
  formData: FormData,
): Promise<InteractionFormState> {
  const followUpRaw = formData.get('followUpAt');
  const parsed = customerInteractionSchema.safeParse({
    customerId: formData.get('customerId'),
    type: formData.get('type') ?? 'NOTE',
    subject: formData.get('subject'),
    body: formData.get('body') ?? '',
    followUpAt: followUpRaw ? followUpRaw : null,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await customerService.addInteraction(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/crm/${parsed.data.customerId}`);
  return { success: true };
}
