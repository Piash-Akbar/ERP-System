import 'server-only';
import path from 'node:path';
import { mkdir, writeFile, readFile, stat, unlink } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

/**
 * Local disk storage driver. Files are written under UPLOAD_DIR (default
 * ./storage/uploads) and referenced by a relative storagePath that is safe
 * against directory traversal. Swap this module for an S3 driver in prod
 * without changing the service layer — the function signatures are stable.
 */

const ROOT = path.resolve(process.env.UPLOAD_DIR ?? 'storage/uploads');

function safeJoin(rel: string): string {
  const normalized = path.normalize(rel).replace(/^(\.\.(\/|\\|$))+/g, '');
  const abs = path.join(ROOT, normalized);
  if (!abs.startsWith(ROOT + path.sep) && abs !== ROOT) {
    throw new Error('Invalid storage path');
  }
  return abs;
}

function uniqueName(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase().slice(0, 12);
  const stem = randomBytes(16).toString('hex');
  const datePart = new Date().toISOString().slice(0, 10);
  return path.posix.join(datePart, `${stem}${ext}`);
}

export const localStorage = {
  async put(originalName: string, data: ArrayBuffer | Buffer): Promise<{ storagePath: string }> {
    const rel = uniqueName(originalName);
    const abs = safeJoin(rel);
    await mkdir(path.dirname(abs), { recursive: true });
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    await writeFile(abs, buf);
    return { storagePath: rel };
  },

  async get(storagePath: string): Promise<Buffer> {
    return readFile(safeJoin(storagePath));
  },

  async stat(storagePath: string) {
    return stat(safeJoin(storagePath));
  },

  async remove(storagePath: string): Promise<void> {
    try {
      await unlink(safeJoin(storagePath));
    } catch (e) {
      const err = e as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') throw e;
    }
  },
};
