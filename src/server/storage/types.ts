export interface StorageDriver {
  put(originalName: string, data: Buffer): Promise<{ storagePath: string }>;
  get(storagePath: string): Promise<Buffer>;
  remove(storagePath: string): Promise<void>;
}
