import { auth } from '@/server/auth/config';
import { prisma } from '@/server/db';

export async function GET() {
  const raw = await auth();
  if (!raw?.user?.id) return Response.json({ error: 'no auth token' });

  const userId = raw.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, status: true,
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
  });

  if (!user) return Response.json({ error: 'user not found in DB', jwtUserId: userId });

  const perms = user.roles.flatMap(ur => ur.role.permissions.map(rp => rp.permission.key));

  return Response.json({
    jwtUserId: userId,
    dbUserId: user.id,
    email: user.email,
    status: user.status,
    roles: user.roles.map(ur => ur.role.name),
    permissionCount: perms.length,
    hasTradeLcIssue: perms.includes('trade:lc-issue'),
    tradePerms: perms.filter(p => p.startsWith('trade:')),
  });
}
