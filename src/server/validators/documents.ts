import { z } from 'zod';

export const documentUploadSchema = z.object({
  branchId: z.string().cuid().optional().or(z.literal('')),
  category: z.string().trim().max(60).optional().or(z.literal('')),
  tags: z.array(z.string().trim().min(1).max(40)).default([]),
  expiresAt: z.coerce.date().optional(),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;

export const documentLinkSchema = z.object({
  documentId: z.string().cuid(),
  entityType: z.string().trim().min(1).max(60),
  entityId: z.string().trim().min(1).max(60),
  note: z.string().trim().max(200).optional().or(z.literal('')),
});
export type DocumentLinkInput = z.infer<typeof documentLinkSchema>;
