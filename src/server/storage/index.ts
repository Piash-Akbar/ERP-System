import 'server-only';
import { prisma } from '@/server/db';
import { localStorage } from './local';
import { googleDriveStorage, GDRIVE_PREFIX } from './google-drive';

async function getConfiguredFolderId(): Promise<string | null> {
  const [driverRow, folderRow] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: 'storage.driver' } }),
    prisma.appSetting.findUnique({ where: { key: 'storage.googleDriveFolderId' } }),
  ]);
  if (driverRow?.value === 'google-drive' && folderRow?.value) {
    return folderRow.value;
  }
  return null;
}

/** Upload a file using the currently configured storage driver. */
export async function storagePut(
  originalName: string,
  data: Buffer,
): Promise<{ storagePath: string }> {
  const folderId = await getConfiguredFolderId();
  if (folderId) {
    return googleDriveStorage.put(originalName, data, folderId);
  }
  return localStorage.put(originalName, data);
}

/** Retrieve a file buffer, routing by storagePath prefix. */
export async function storageGet(storagePath: string): Promise<Buffer> {
  if (storagePath.startsWith(GDRIVE_PREFIX)) {
    return googleDriveStorage.get(storagePath);
  }
  return localStorage.get(storagePath);
}

/** Delete a file, routing by storagePath prefix. */
export async function storageRemove(storagePath: string): Promise<void> {
  if (storagePath.startsWith(GDRIVE_PREFIX)) {
    return googleDriveStorage.remove(storagePath);
  }
  return localStorage.remove(storagePath);
}

/** Read current storage settings for display. */
export async function getStorageSettings() {
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: ['storage.driver', 'storage.googleDriveFolderId'] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    driver: (map['storage.driver'] ?? 'local') as 'local' | 'google-drive',
    googleDriveFolderId: map['storage.googleDriveFolderId'] ?? '',
  };
}
