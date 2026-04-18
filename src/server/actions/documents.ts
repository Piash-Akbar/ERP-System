'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/server/auth/session';
import { documentService } from '@/server/services/document.service';
import {
  documentUploadSchema,
  documentLinkSchema,
} from '@/server/validators/documents';
import { ApiError } from '@/lib/errors';

export type DocumentFormState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean; documentId?: string }
  | undefined;

export async function uploadDocumentAction(
  _prev: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Select a file to upload' };
  }
  const tagsRaw = formData.get('tags');
  const tags =
    typeof tagsRaw === 'string'
      ? tagsRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
  const expiresRaw = formData.get('expiresAt');
  const parsed = documentUploadSchema.safeParse({
    branchId: formData.get('branchId') ?? '',
    category: formData.get('category') ?? '',
    tags,
    expiresAt: typeof expiresRaw === 'string' && expiresRaw ? expiresRaw : undefined,
    notes: formData.get('notes') ?? '',
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    const doc = await documentService.upload(session, file, parsed.data);
    revalidatePath('/documents');
    return { success: true, documentId: doc.id };
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
}

export async function linkDocumentAction(
  _prev: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const parsed = documentLinkSchema.safeParse({
    documentId: formData.get('documentId'),
    entityType: formData.get('entityType'),
    entityId: formData.get('entityId'),
    note: formData.get('note') ?? '',
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const session = await getSession();
    await documentService.link(session, parsed.data);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/documents/${parsed.data.documentId}`);
  return { success: true };
}

export async function unlinkDocumentAction(documentId: string, linkId: string) {
  try {
    const session = await getSession();
    await documentService.unlink(session, linkId);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/documents/${documentId}`);
  return { success: true };
}

export async function deleteDocumentAction(id: string) {
  try {
    const session = await getSession();
    await documentService.remove(session, id);
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
  revalidatePath('/documents');
  return { success: true };
}
