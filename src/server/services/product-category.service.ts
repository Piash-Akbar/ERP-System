import 'server-only';
import { prisma } from '@/server/db';
import { authorize } from '@/server/auth/authorize';
import { recordAudit } from '@/server/audit/logger';
import type { AppSession } from '@/server/auth/session';
import type { CategoryCreateInput, CategoryUpdateInput } from '@/server/validators/product-categories';
import { NotFoundError, ValidationError } from '@/lib/errors';

const CATEGORY_INCLUDE = {
  parent: { select: { id: true, name: true } },
  _count: { select: { products: true, children: true } },
} as const;

export const categoryService = {
  async list(session: AppSession | null) {
    await authorize(session, 'inventory:read');
    return prisma.productCategory.findMany({
      orderBy: { name: 'asc' },
      include: CATEGORY_INCLUDE,
    });
  },

  async listFlat(session: AppSession | null) {
    await authorize(session, 'inventory:read');
    return prisma.productCategory.findMany({ orderBy: { name: 'asc' } });
  },

  async getById(session: AppSession | null, id: string) {
    await authorize(session, 'inventory:read');
    const cat = await prisma.productCategory.findUnique({ where: { id }, include: CATEGORY_INCLUDE });
    if (!cat) throw new NotFoundError('Category not found');
    return cat;
  },

  async create(session: AppSession | null, input: CategoryCreateInput) {
    const actor = await authorize(session, 'inventory:write');
    const dup = await prisma.productCategory.findUnique({ where: { name: input.name } });
    if (dup) throw new ValidationError('Category name already exists');

    return prisma.$transaction(async (tx) => {
      const cat = await tx.productCategory.create({
        data: {
          name: input.name,
          description: input.description || null,
          parentId: input.parentId || null,
        },
      });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: actor.activeBranchId,
          module: 'inventory',
          action: 'category.create',
          entityType: 'ProductCategory',
          entityId: cat.id,
          after: { name: cat.name, parentId: cat.parentId },
        },
        tx,
      );
      return cat;
    });
  },

  async update(session: AppSession | null, input: CategoryUpdateInput) {
    const actor = await authorize(session, 'inventory:write');
    const existing = await prisma.productCategory.findUnique({ where: { id: input.id } });
    if (!existing) throw new NotFoundError('Category not found');
    if (input.parentId === input.id) throw new ValidationError('A category cannot be its own parent');
    if (input.name !== existing.name) {
      const dup = await prisma.productCategory.findUnique({ where: { name: input.name } });
      if (dup) throw new ValidationError('Category name already exists');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.productCategory.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description || null,
          parentId: input.parentId || null,
        },
      });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: actor.activeBranchId,
          module: 'inventory',
          action: 'category.update',
          entityType: 'ProductCategory',
          entityId: updated.id,
          before: { name: existing.name, parentId: existing.parentId },
          after: { name: updated.name, parentId: updated.parentId },
        },
        tx,
      );
      return updated;
    });
  },
};
