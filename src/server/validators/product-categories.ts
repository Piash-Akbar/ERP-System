import { z } from 'zod';

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  parentId: z.string().cuid().optional().or(z.literal('')),
});

export const categoryUpdateSchema = categoryCreateSchema.extend({
  id: z.string().cuid(),
});

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
