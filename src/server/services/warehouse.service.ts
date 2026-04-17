import 'server-only';
import { prisma } from '@/server/db';
import { authorize } from '@/server/auth/authorize';
import { recordAudit } from '@/server/audit/logger';
import type { AppSession } from '@/server/auth/session';
import type { WarehouseCreateInput, WarehouseUpdateInput } from '@/server/validators/warehouses';
import { NotFoundError, ValidationError } from '@/lib/errors';

const WAREHOUSE_INCLUDE = {
  branch: { select: { id: true, name: true, code: true, currency: true } },
} as const;

export const warehouseService = {
  async listAll(session: AppSession | null) {
    await authorize(session, 'warehouse:read');
    return prisma.warehouse.findMany({
      orderBy: [{ branch: { name: 'asc' } }, { name: 'asc' }],
      include: WAREHOUSE_INCLUDE,
    });
  },

  async listActiveForBranch(session: AppSession | null, branchId: string) {
    await authorize(session, 'warehouse:read');
    return prisma.warehouse.findMany({
      where: { branchId, isActive: true },
      orderBy: { name: 'asc' },
    });
  },

  async getById(session: AppSession | null, id: string) {
    await authorize(session, 'warehouse:read');
    const wh = await prisma.warehouse.findUnique({ where: { id }, include: WAREHOUSE_INCLUDE });
    if (!wh) throw new NotFoundError('Warehouse not found');
    return wh;
  },

  async create(session: AppSession | null, input: WarehouseCreateInput) {
    const actor = await authorize(session, 'warehouse:read');
    // tighter: require warehouse mutation to carry through as inventory:write since there is no explicit create perm
    await authorize(session, 'inventory:write');

    const dup = await prisma.warehouse.findUnique({
      where: { branchId_code: { branchId: input.branchId, code: input.code } },
    });
    if (dup) throw new ValidationError('Code already used for this branch');

    return prisma.$transaction(async (tx) => {
      const wh = await tx.warehouse.create({
        data: {
          branchId: input.branchId,
          code: input.code,
          name: input.name,
          type: input.type,
          address: input.address || null,
          isActive: input.isActive,
        },
      });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: wh.branchId,
          module: 'warehouse',
          action: 'create',
          entityType: 'Warehouse',
          entityId: wh.id,
          after: { code: wh.code, name: wh.name, type: wh.type },
        },
        tx,
      );
      return wh;
    });
  },

  async update(session: AppSession | null, input: WarehouseUpdateInput) {
    const actor = await authorize(session, 'inventory:write');
    const existing = await prisma.warehouse.findUnique({ where: { id: input.id } });
    if (!existing) throw new NotFoundError('Warehouse not found');
    if (
      input.code !== existing.code ||
      input.branchId !== existing.branchId
    ) {
      const dup = await prisma.warehouse.findUnique({
        where: { branchId_code: { branchId: input.branchId, code: input.code } },
      });
      if (dup && dup.id !== input.id) throw new ValidationError('Code already used for this branch');
    }

    return prisma.$transaction(async (tx) => {
      const wh = await tx.warehouse.update({
        where: { id: input.id },
        data: {
          branchId: input.branchId,
          code: input.code,
          name: input.name,
          type: input.type,
          address: input.address || null,
          isActive: input.isActive,
        },
      });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: wh.branchId,
          module: 'warehouse',
          action: 'update',
          entityType: 'Warehouse',
          entityId: wh.id,
          before: { code: existing.code, name: existing.name, isActive: existing.isActive },
          after: { code: wh.code, name: wh.name, isActive: wh.isActive },
        },
        tx,
      );
      return wh;
    });
  },
};
