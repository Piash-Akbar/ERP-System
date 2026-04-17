'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/server/auth/session';
import { roleService } from '@/server/services/role.service';
import { roleCreateSchema, roleUpdateSchema } from '@/server/validators/roles';
import { ApiError } from '@/lib/errors';

export type RoleFormState = { error?: string; fieldErrors?: Record<string, string[]> } | undefined;

function parseForm(formData: FormData) {
  return {
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    permissionKeys: formData.getAll('permissionKeys'),
  };
}

export async function createRoleAction(_prev: RoleFormState, formData: FormData): Promise<RoleFormState> {
  const parsed = roleCreateSchema.safeParse(parseForm(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const session = await getSession();
    await roleService.create(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }

  revalidatePath('/roles');
  redirect('/roles');
}

export async function updateRoleAction(_prev: RoleFormState, formData: FormData): Promise<RoleFormState> {
  const parsed = roleUpdateSchema.safeParse({ id: formData.get('id'), ...parseForm(formData) });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const session = await getSession();
    await roleService.update(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }

  revalidatePath('/roles');
  redirect('/roles');
}

export async function deleteRoleAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const session = await getSession();
  try {
    await roleService.remove(session, id);
  } catch (e) {
    if (e instanceof ApiError) throw new Error(e.message);
    throw e;
  }
  revalidatePath('/roles');
}
