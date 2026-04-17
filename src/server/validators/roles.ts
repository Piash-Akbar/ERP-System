import { z } from 'zod';

export const roleCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  permissionKeys: z.array(z.string()).default([]),
});

export const roleUpdateSchema = z.object({
  id: z.string().cuid(),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  permissionKeys: z.array(z.string()).default([]),
});

export type RoleCreateInput = z.infer<typeof roleCreateSchema>;
export type RoleUpdateInput = z.infer<typeof roleUpdateSchema>;
