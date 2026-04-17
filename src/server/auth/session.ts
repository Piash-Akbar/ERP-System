import 'server-only';
import { cookies } from 'next/headers';
import { auth } from './config';
import { ACTIVE_BRANCH_COOKIE } from '@/lib/cookies';

export interface AppSession {
  userId: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  activeBranchId: string | null;
}

export async function getSession(): Promise<AppSession | null> {
  const s = await auth();
  if (!s?.user?.id) return null;
  const cookieStore = await cookies();
  const override = cookieStore.get(ACTIVE_BRANCH_COOKIE)?.value;
  return {
    userId: s.user.id,
    email: s.user.email ?? '',
    name: s.user.name ?? '',
    roles: s.user.roles ?? [],
    permissions: s.user.permissions ?? [],
    activeBranchId: override ?? s.user.activeBranchId ?? null,
  };
}

export async function requireSession(): Promise<AppSession> {
  const s = await getSession();
  if (!s) throw new Error('UNAUTHENTICATED');
  return s;
}
