import 'server-only';
import { ForbiddenError, UnauthorizedError } from '@/lib/errors';
import type { Permission } from '@/lib/permissions';
import type { AppSession } from './session';

export async function authorize(
  session: AppSession | null,
  permission: Permission,
  ctx?: { branchId?: string | null },
): Promise<AppSession> {
  if (!session) throw new UnauthorizedError();
  if (!session.permissions.includes(permission)) {
    throw new ForbiddenError(`Missing permission: ${permission}`);
  }
  if (ctx?.branchId && session.activeBranchId && ctx.branchId !== session.activeBranchId) {
    throw new ForbiddenError(`Branch mismatch: active=${session.activeBranchId}`);
  }
  return session;
}
