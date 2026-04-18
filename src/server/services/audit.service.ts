import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { authorize } from '@/server/auth/authorize';
import type { AppSession } from '@/server/auth/session';

export interface AuditFilters {
  branchId?: string;
  module?: string;
  action?: string;
  entityType?: string;
  actorId?: string;
  search?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

export const auditService = {
  async list(session: AppSession | null, filters: AuditFilters = {}) {
    await authorize(session, 'audit:read');
    const where: Prisma.AuditLogWhereInput = {
      branchId: filters.branchId,
      module: filters.module,
      action: filters.action,
      entityType: filters.entityType,
      actorId: filters.actorId,
      createdAt:
        filters.from || filters.to
          ? { gte: filters.from, lte: filters.to }
          : undefined,
      OR: filters.search
        ? [
            { entityType: { contains: filters.search, mode: 'insensitive' } },
            { entityId: { contains: filters.search, mode: 'insensitive' } },
            { action: { contains: filters.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit ?? 100,
        skip: filters.offset ?? 0,
        include: {
          actor: { select: { id: true, name: true, email: true } },
          branch: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { rows, total };
  },

  async modules(session: AppSession | null) {
    await authorize(session, 'audit:read');
    const rows = await prisma.auditLog.findMany({
      distinct: ['module'],
      select: { module: true },
      orderBy: { module: 'asc' },
    });
    return rows.map((r) => r.module);
  },

  async getById(session: AppSession | null, id: string) {
    await authorize(session, 'audit:read');
    return prisma.auditLog.findUnique({
      where: { id },
      include: {
        actor: { select: { id: true, name: true, email: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    });
  },
};
