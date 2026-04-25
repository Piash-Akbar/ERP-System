'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { getSession } from '@/server/auth/session';
import { authorize } from '@/server/auth/authorize';
import { googleDriveStorage } from '@/server/storage/google-drive';
import { ApiError } from '@/lib/errors';

const storageSettingsSchema = z.object({
  driver: z.enum(['local', 'google-drive']),
  googleDriveFolderId: z.string().trim().max(200).optional(),
});

export type StorageSettingsState =
  | { error?: string; success?: boolean }
  | undefined;

export async function saveStorageSettingsAction(
  _prev: StorageSettingsState,
  formData: FormData,
): Promise<StorageSettingsState> {
  try {
    const session = await getSession();
    await authorize(session, 'settings:write');

    const parsed = storageSettingsSchema.safeParse({
      driver: formData.get('driver'),
      googleDriveFolderId: formData.get('googleDriveFolderId') ?? '',
    });
    if (!parsed.success) {
      return { error: parsed.error.errors[0]?.message ?? 'Invalid input' };
    }

    const { driver, googleDriveFolderId } = parsed.data;

    if (driver === 'google-drive') {
      if (!googleDriveFolderId) {
        return { error: 'Google Drive folder ID is required' };
      }
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        return {
          error:
            'GOOGLE_SERVICE_ACCOUNT_JSON env var is not set. Add your service account credentials before switching to Google Drive.',
        };
      }
    }

    await prisma.$transaction([
      prisma.appSetting.upsert({
        where: { key: 'storage.driver' },
        create: { key: 'storage.driver', value: driver },
        update: { value: driver },
      }),
      prisma.appSetting.upsert({
        where: { key: 'storage.googleDriveFolderId' },
        create: { key: 'storage.googleDriveFolderId', value: googleDriveFolderId ?? '' },
        update: { value: googleDriveFolderId ?? '' },
      }),
    ]);

    revalidatePath('/documents/settings');
    return { success: true };
  } catch (e) {
    if (e instanceof ApiError) return { error: e.message };
    throw e;
  }
}

export async function testDriveConnectionAction(
  folderId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    await authorize(session, 'settings:write');
    await googleDriveStorage.testConnection(folderId);
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Connection test failed';
    return { success: false, error: msg };
  }
}
