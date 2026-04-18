import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { authorize } from '@/server/auth/authorize';
import { recordAudit } from '@/server/audit/logger';
import type { AppSession } from '@/server/auth/session';
import { NotFoundError, ValidationError } from '@/lib/errors';
import type {
  ChartAccountCreateInput,
  ChartAccountUpdateInput,
} from '@/server/validators/coa';

function buildPath(parentPath: string | null, code: string) {
  return parentPath ? `${parentPath}/${code}` : code;
}

export const coaService = {
  async list(session: AppSession | null, filters?: { type?: string; branchId?: string; activeOnly?: boolean }) {
    await authorize(session, 'coa:read');
    return prisma.chartAccount.findMany({
      where: {
        type: filters?.type as never,
        branchId: filters?.branchId ?? undefined,
        isActive: filters?.activeOnly ? true : undefined,
      },
      orderBy: [{ path: 'asc' }],
    });
  },

  async tree(session: AppSession | null) {
    await authorize(session, 'coa:read');
    const rows = await prisma.chartAccount.findMany({
      orderBy: [{ path: 'asc' }],
    });
    return rows;
  },

  async getById(session: AppSession | null, id: string) {
    await authorize(session, 'coa:read');
    const account = await prisma.chartAccount.findUnique({
      where: { id },
      include: { parent: true, children: { orderBy: { code: 'asc' } } },
    });
    if (!account) throw new NotFoundError('Account not found');
    return account;
  },

  async create(session: AppSession | null, input: ChartAccountCreateInput) {
    const actor = await authorize(session, 'coa:write');

    const existing = await prisma.chartAccount.findUnique({ where: { code: input.code } });
    if (existing) throw new ValidationError('Account code already exists');

    let parent: { id: string; path: string; depth: number; type: string; isPosting: boolean } | null = null;
    if (input.parentId) {
      const p = await prisma.chartAccount.findUnique({ where: { id: input.parentId } });
      if (!p) throw new ValidationError('Parent account not found');
      if (p.type !== input.type) throw new ValidationError('Parent type must match child type');
      parent = p;
    }

    const path = buildPath(parent?.path ?? null, input.code);
    const depth = parent ? parent.depth + 1 : 0;

    return prisma.$transaction(async (tx) => {
      // If parent was a posting leaf, demote it (headers can't post).
      if (parent?.isPosting) {
        await tx.chartAccount.update({
          where: { id: parent.id },
          data: { isPosting: false },
        });
      }

      const account = await tx.chartAccount.create({
        data: {
          code: input.code,
          name: input.name,
          type: input.type,
          normalSide: input.normalSide,
          parentId: input.parentId ?? null,
          path,
          depth,
          isPosting: input.isPosting,
          isControl: input.isControl,
          currency: input.currency,
          branchId: input.branchId ?? null,
          openingBalance: new Prisma.Decimal(input.openingBalance),
          description: input.description || null,
          isActive: input.isActive,
          createdById: actor.userId,
          updatedById: actor.userId,
        },
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: actor.activeBranchId,
          module: 'coa',
          action: 'create',
          entityType: 'ChartAccount',
          entityId: account.id,
          after: { code: account.code, name: account.name, type: account.type, path: account.path },
        },
        tx,
      );
      return account;
    });
  },

  async update(session: AppSession | null, input: ChartAccountUpdateInput) {
    const actor = await authorize(session, 'coa:write');
    const existing = await prisma.chartAccount.findUnique({ where: { id: input.id } });
    if (!existing) throw new NotFoundError('Account not found');
    if (existing.isSystem && (input.code !== existing.code || input.type !== existing.type)) {
      throw new ValidationError('System accounts cannot have code or type changed');
    }

    if (input.code !== existing.code) {
      const dup = await prisma.chartAccount.findUnique({ where: { code: input.code } });
      if (dup && dup.id !== existing.id) throw new ValidationError('Account code already exists');
    }

    // Reparenting
    let newParent: { id: string; path: string; depth: number; type: string } | null = null;
    if (input.parentId && input.parentId !== existing.parentId) {
      if (input.parentId === existing.id) throw new ValidationError('Cannot parent to self');
      const p = await prisma.chartAccount.findUnique({ where: { id: input.parentId } });
      if (!p) throw new ValidationError('Parent account not found');
      if (p.type !== input.type) throw new ValidationError('Parent type must match child type');
      if (p.path.startsWith(`${existing.path}/`) || p.path === existing.path) {
        throw new ValidationError('Cannot move an account under one of its descendants');
      }
      newParent = p;
    }

    const parentPath = newParent
      ? newParent.path
      : input.parentId === existing.parentId && existing.parentId
        ? existing.path.slice(0, existing.path.lastIndexOf('/'))
        : null;
    const newPath = buildPath(parentPath, input.code);
    const newDepth = newParent ? newParent.depth + 1 : input.parentId ? existing.depth : 0;
    const pathChanged = newPath !== existing.path;

    return prisma.$transaction(async (tx) => {
      const account = await tx.chartAccount.update({
        where: { id: input.id },
        data: {
          code: input.code,
          name: input.name,
          type: input.type,
          normalSide: input.normalSide,
          parentId: input.parentId ?? null,
          path: newPath,
          depth: newDepth,
          isPosting: input.isPosting,
          isControl: input.isControl,
          currency: input.currency,
          branchId: input.branchId ?? null,
          openingBalance: new Prisma.Decimal(input.openingBalance),
          description: input.description || null,
          isActive: input.isActive,
          updatedById: actor.userId,
        },
      });

      if (pathChanged) {
        const descendants = await tx.chartAccount.findMany({
          where: { path: { startsWith: `${existing.path}/` } },
        });
        for (const d of descendants) {
          const suffix = d.path.slice(existing.path.length);
          await tx.chartAccount.update({
            where: { id: d.id },
            data: { path: `${newPath}${suffix}`, depth: newDepth + suffix.split('/').length - 1 },
          });
        }
      }

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: actor.activeBranchId,
          module: 'coa',
          action: 'update',
          entityType: 'ChartAccount',
          entityId: account.id,
          before: { code: existing.code, name: existing.name, path: existing.path, isActive: existing.isActive },
          after: { code: account.code, name: account.name, path: account.path, isActive: account.isActive },
        },
        tx,
      );
      return account;
    });
  },
};
