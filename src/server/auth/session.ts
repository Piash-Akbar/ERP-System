import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { auth } from './config';
import { prisma } from '@/server/db';
import { ACTIVE_BRANCH_COOKIE } from '@/lib/cookies';

export interface AppSession {
  userId: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  activeBranchId: string | null;
}

// Permissions are loaded from DB per-request (not JWT) to avoid cookie size limits
// and to ensure permission changes take effect without requiring re-login.
// cache() deduplicates this within a single request.
export const getSession = cache(async (): Promise<AppSession | null> => {
  const s = await auth();
  if (!s?.user?.id) return null;

  const [cookieStore, userWithRoles] = await Promise.all([
    cookies(),
    prisma.user.findUnique({
      where: { id: s.user.id, status: 'ACTIVE' },
      select: {
        id: true,
        email: true,
        name: true,
        defaultBranchId: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
                permissions: { select: { permission: { select: { key: true } } } },
              },
            },
          },
        },
      },
    }),
  ]);

  if (!userWithRoles) return null;

  const permSet = new Set<string>();
  const roleNames: string[] = [];
  for (const ur of userWithRoles.roles) {
    roleNames.push(ur.role.name);
    for (const rp of ur.role.permissions) permSet.add(rp.permission.key);
  }

  const override = cookieStore.get(ACTIVE_BRANCH_COOKIE)?.value;
  return {
    userId: userWithRoles.id,
    email: userWithRoles.email,
    name: userWithRoles.name ?? '',
    roles: roleNames,
    permissions: [...permSet],
    activeBranchId: override ?? s.user.activeBranchId ?? userWithRoles.defaultBranchId ?? null,
  };
});

export async function requireSession(): Promise<AppSession> {
  const s = await getSession();
  if (!s) throw new Error('UNAUTHENTICATED');
  return s;
}
