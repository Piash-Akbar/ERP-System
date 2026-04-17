import { z } from 'zod';

export const userCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  password: z.string().min(8, 'Minimum 8 characters').max(128),
  defaultBranchId: z.string().cuid().optional().or(z.literal('')),
  roleIds: z.array(z.string().cuid()).default([]),
  status: z.enum(['ACTIVE', 'DISABLED', 'PENDING']).default('ACTIVE'),
});

export const userUpdateSchema = z.object({
  id: z.string().cuid(),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  /// blank → keep existing
  password: z.string().min(8).max(128).optional().or(z.literal('')),
  defaultBranchId: z.string().cuid().optional().or(z.literal('')),
  roleIds: z.array(z.string().cuid()).default([]),
  status: z.enum(['ACTIVE', 'DISABLED', 'PENDING']),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
