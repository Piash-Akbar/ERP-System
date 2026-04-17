'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/server/auth/session';
import { categoryService } from '@/server/services/product-category.service';
import { categoryCreateSchema, categoryUpdateSchema } from '@/server/validators/product-categories';
import { ApiError } from '@/lib/errors';

export type CategoryFormState = { error?: string; fieldErrors?: Record<string, string[]> } | undefined;

function parseForm(formData: FormData) {
  return {
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    parentId: formData.get('parentId') ?? '',
  };
}

export async function createCategoryAction(_prev: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  const parsed = categoryCreateSchema.safeParse(parseForm(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await categoryService.create(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/inventory/categories');
  redirect('/inventory/categories');
}

export async function updateCategoryAction(_prev: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  const parsed = categoryUpdateSchema.safeParse({ id: formData.get('id'), ...parseForm(formData) });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await categoryService.update(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/inventory/categories');
  redirect('/inventory/categories');
}
