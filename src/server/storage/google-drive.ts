import 'server-only';
import { Readable } from 'node:stream';
import { google } from 'googleapis';

export const GDRIVE_PREFIX = 'gdrive:';

function getDriveClient() {
  const credJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credJson) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_JSON env var is not set. ' +
        'Add your service account credentials JSON to the environment.',
    );
  }
  const credentials = JSON.parse(credJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  return google.drive({ version: 'v3', auth });
}

export const googleDriveStorage = {
  async put(
    originalName: string,
    data: Buffer,
    folderId: string,
  ): Promise<{ storagePath: string }> {
    const drive = getDriveClient();
    const res = await drive.files.create({
      requestBody: {
        name: originalName,
        parents: [folderId],
      },
      media: {
        mimeType: 'application/octet-stream',
        body: Readable.from(data),
      },
      fields: 'id',
    });
    const fileId = res.data.id;
    if (!fileId) throw new Error('Google Drive did not return a file ID');
    return { storagePath: `${GDRIVE_PREFIX}${fileId}` };
  },

  async get(storagePath: string): Promise<Buffer> {
    const fileId = storagePath.slice(GDRIVE_PREFIX.length);
    const drive = getDriveClient();
    const res = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' },
    );
    return Buffer.from(res.data as ArrayBuffer);
  },

  async remove(storagePath: string): Promise<void> {
    const fileId = storagePath.slice(GDRIVE_PREFIX.length);
    const drive = getDriveClient();
    try {
      await drive.files.delete({ fileId });
    } catch {
      // Ignore 404 — file already gone
    }
  },

  async testConnection(folderId: string): Promise<void> {
    const drive = getDriveClient();
    await drive.files.get({ fileId: folderId, fields: 'id,name' });
  },
};
