import 'server-only';
import bcrypt from 'bcryptjs';
import { prisma } from '@/server/db';
import { authorize } from '@/server/auth/authorize';
import { recordAudit } from '@/server/audit/logger';
import type { AppSession } from '@/server/auth/session';
import type { UserCreateInput, UserUpdateInput } from '@/server/validators/users';
import { NotFoundError, ValidationError } from '@/lib/errors';

const USER_INCLUDE = {
  defaultBranch: { select: { id: true, name: true, code: true } },
  roles: { include: { role: { select: { id: true, name: true } } } },
} as const;

export const userService = {
  async list(session: AppSession | null) {
    await authorize(session, 'users:read');
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: USER_INCLUDE,
    });
  },

  async getById(session: AppSession | null, id: string) {
    await authorize(session, 'users:read');
    const user = await prisma.user.findUnique({ where: { id }, include: USER_INCLUDE });
    if (!user) throw new NotFoundError('User not found');
    return user;
  },

  async create(session: AppSession | null, input: UserCreateInput) {
    const actor = await authorize(session, 'users:write');

    const exists = await prisma.user.findUnique({ where: { email: input.email } });
    if (exists) throw new ValidationError('Email already in use');

    const passwordHash = await bcrypt.hash(input.password, 10);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone || null,
          passwordHash,
          status: input.status,
          defaultBranchId: input.defaultBranchId || null,
          roles: {
            create: input.roleIds.map((roleId) => ({ roleId })),
          },
        },
        include: USER_INCLUDE,
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: actor.activeBranchId,
          module: 'users',
          action: 'create',
          entityType: 'User',
          entityId: user.id,
          after: {
            email: user.email,
            name: user.name,
            status: user.status,
            roleIds: input.roleIds,
          },
        },
        tx,
      );

      return user;
    });
  },

  async update(session: AppSession | null, input: UserUpdateInput) {
    const actor = await authorize(session, 'users:write');
    const existing = await prisma.user.findUnique({
      where: { id: input.id },
      include: USER_INCLUDE,
    });
    if (!existing) throw new NotFoundError('User not found');

    if (input.email !== existing.email) {
      const dup = await prisma.user.findUnique({ where: { email: input.email } });
      if (dup) throw new ValidationError('Email already in use');
    }

    return prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: input.id } });

      const data: {
        name: string;
        email: string;
        phone: string | null;
        status: UserUpdateInput['status'];
        defaultBranchId: string | null;
        passwordHash?: string;
        roles: { create: { roleId: string }[] };
      } = {
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        status: input.status,
        defaultBranchId: input.defaultBranchId || null,
        roles: { create: input.roleIds.map((roleId) => ({ roleId })) },
      };
      if (input.password) data.passwordHash = await bcrypt.hash(input.password, 10);

      const updated = await tx.user.update({
        where: { id: input.id },
        data,
        include: USER_INCLUDE,
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: actor.activeBranchId,
          module: 'users',
          action: input.password ? 'update-with-password' : 'update',
          entityType: 'User',
          entityId: updated.id,
          before: {
            email: existing.email,
            name: existing.name,
            status: existing.status,
            roleIds: existing.roles.map((r) => r.role.id),
          },
          after: {
            email: updated.email,
            name: updated.name,
            status: updated.status,
            roleIds: input.roleIds,
          },
        },
        tx,
      );

      return updated;
    });
  },

  async setStatus(session: AppSession | null, id: string, status: 'ACTIVE' | 'DISABLED') {
    const actor = await authorize(session, 'users:write');
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('User not found');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({ where: { id }, data: { status } });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: actor.activeBranchId,
          module: 'users',
          action: status === 'DISABLED' ? 'disable' : 'enable',
          entityType: 'User',
          entityId: id,
          before: { status: existing.status },
          after: { status: updated.status },
        },
        tx,
      );
      return updated;
    });
  },
};
