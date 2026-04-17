import { getSession } from '@/server/auth/session';

export async function PermissionGate({
  permission,
  fallback = null,
  children,
}: {
  permission: string | string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) return <>{fallback}</>;
  const needed = Array.isArray(permission) ? permission : [permission];
  const ok = needed.every((p) => session.permissions.includes(p));
  return <>{ok ? children : fallback}</>;
}
