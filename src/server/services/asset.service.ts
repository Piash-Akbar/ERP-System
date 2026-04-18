import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { authorize } from '@/server/auth/authorize';
import { recordAudit } from '@/server/audit/logger';
import type { AppSession } from '@/server/auth/session';
import type {
  AssetCategoryInput,
  AssetCreateInput,
  AssetUpdateInput,
  AssetTransferInput,
  AssetDisposeInput,
  AssetDepreciateInput,
  AssetDepreciateBulkInput,
} from '@/server/validators/assets';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { nextAssetCode } from '@/lib/document-number';

const ASSET_INCLUDE = {
  branch: { select: { id: true, name: true, code: true, currency: true } },
  category: { select: { id: true, name: true, depreciationMethod: true } },
} satisfies Prisma.AssetInclude;

function bookValue(asset: {
  purchaseCost: Prisma.Decimal;
  accumulatedDepreciation: Prisma.Decimal;
}) {
  return asset.purchaseCost.minus(asset.accumulatedDepreciation);
}

function monthsBetween(from: Date, to: Date) {
  const years = to.getFullYear() - from.getFullYear();
  const months = to.getMonth() - from.getMonth();
  return years * 12 + months + (to.getDate() >= from.getDate() ? 0 : -1);
}

/**
 * Compute the depreciation amount to post for the period ending at `periodEnd`.
 * Straight-line: equal monthly expense across useful life.
 * Declining-balance: 2x SL rate applied to current book value monthly.
 * Never depreciates below salvage value.
 */
function computeDepreciation(
  asset: {
    purchaseCost: Prisma.Decimal;
    salvageValue: Prisma.Decimal;
    accumulatedDepreciation: Prisma.Decimal;
    usefulLifeMonths: number;
    depreciationMethod: 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'NONE';
    purchaseDate: Date;
    lastDepreciatedAt: Date | null;
  },
  periodEnd: Date,
): Prisma.Decimal {
  if (asset.depreciationMethod === 'NONE') return new Prisma.Decimal(0);

  const startFrom = asset.lastDepreciatedAt ?? asset.purchaseDate;
  const months = monthsBetween(startFrom, periodEnd);
  if (months <= 0) return new Prisma.Decimal(0);

  const depreciable = asset.purchaseCost.minus(asset.salvageValue);
  const alreadyDepreciated = asset.accumulatedDepreciation;
  const remaining = depreciable.minus(alreadyDepreciated);
  if (remaining.lte(0)) return new Prisma.Decimal(0);

  if (asset.depreciationMethod === 'STRAIGHT_LINE') {
    const perMonth = depreciable.div(asset.usefulLifeMonths);
    const raw = perMonth.mul(months);
    return Prisma.Decimal.min(raw, remaining);
  }

  // DECLINING_BALANCE: 2x SL rate per year, compounded monthly.
  const annualRate = new Prisma.Decimal(2).div(asset.usefulLifeMonths / 12);
  const monthlyRate = annualRate.div(12);
  let bookVal = asset.purchaseCost.minus(alreadyDepreciated);
  let total = new Prisma.Decimal(0);
  for (let i = 0; i < months; i++) {
    const expense = bookVal.mul(monthlyRate);
    const capped = Prisma.Decimal.min(expense, bookVal.minus(asset.salvageValue));
    if (capped.lte(0)) break;
    total = total.plus(capped);
    bookVal = bookVal.minus(capped);
  }
  return total;
}

export const assetService = {
  async listCategories(session: AppSession | null) {
    await authorize(session, 'assets:read');
    return prisma.assetCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { assets: true } } },
    });
  },

  async upsertCategory(
    session: AppSession | null,
    input: AssetCategoryInput,
    id?: string,
  ) {
    const actor = await authorize(session, 'assets:write');
    const data = {
      name: input.name,
      description: input.description || null,
      depreciationMethod: input.depreciationMethod,
      defaultLifeMonths: input.defaultLifeMonths,
      defaultSalvageRate: new Prisma.Decimal(input.defaultSalvageRate),
    };
    const cat = id
      ? await prisma.assetCategory.update({ where: { id }, data })
      : await prisma.assetCategory.create({ data });
    await recordAudit({
      actorId: actor.userId,
      branchId: null,
      module: 'assets',
      action: id ? 'update-category' : 'create-category',
      entityType: 'AssetCategory',
      entityId: cat.id,
      after: { name: cat.name },
    });
    return cat;
  },

  async list(
    session: AppSession | null,
    filters: { branchId?: string; status?: string; search?: string } = {},
  ) {
    await authorize(session, 'assets:read');
    const assets = await prisma.asset.findMany({
      where: {
        branchId: filters.branchId,
        status: filters.status as Prisma.AssetWhereInput['status'],
        OR: filters.search
          ? [
              { code: { contains: filters.search, mode: 'insensitive' } },
              { name: { contains: filters.search, mode: 'insensitive' } },
              { serialNumber: { contains: filters.search, mode: 'insensitive' } },
              { assignedTo: { contains: filters.search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      orderBy: { code: 'asc' },
      include: ASSET_INCLUDE,
    });
    return assets.map((a) => ({ ...a, bookValue: bookValue(a) }));
  },

  async getById(session: AppSession | null, id: string) {
    await authorize(session, 'assets:read');
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        ...ASSET_INCLUDE,
        movements: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    if (!asset) throw new NotFoundError('Asset not found');
    return { ...asset, bookValue: bookValue(asset) };
  },

  async create(session: AppSession | null, input: AssetCreateInput) {
    const actor = await authorize(session, 'assets:write');

    return prisma.$transaction(async (tx) => {
      const count = await tx.asset.count();
      const code = nextAssetCode(count);
      const asset = await tx.asset.create({
        data: {
          branchId: input.branchId,
          categoryId: input.categoryId || null,
          code,
          name: input.name,
          description: input.description || null,
          serialNumber: input.serialNumber || null,
          location: input.location || null,
          assignedTo: input.assignedTo || null,
          condition: input.condition,
          status: input.status,
          purchaseDate: input.purchaseDate,
          purchaseCost: new Prisma.Decimal(input.purchaseCost),
          salvageValue: new Prisma.Decimal(input.salvageValue),
          usefulLifeMonths: input.usefulLifeMonths,
          depreciationMethod: input.depreciationMethod,
          notes: input.notes || null,
          createdById: actor.userId,
        },
      });

      await tx.assetMovement.create({
        data: {
          assetId: asset.id,
          branchId: asset.branchId,
          type: 'REGISTRATION',
          toLocation: asset.location,
          toAssignee: asset.assignedTo,
          amount: asset.purchaseCost,
          note: 'Initial registration',
          createdById: actor.userId,
        },
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: asset.branchId,
          module: 'assets',
          action: 'create',
          entityType: 'Asset',
          entityId: asset.id,
          after: {
            code: asset.code,
            name: asset.name,
            purchaseCost: asset.purchaseCost.toString(),
          },
        },
        tx,
      );

      return asset;
    });
  },

  async update(session: AppSession | null, input: AssetUpdateInput) {
    const actor = await authorize(session, 'assets:write');
    const existing = await prisma.asset.findUnique({ where: { id: input.id } });
    if (!existing) throw new NotFoundError('Asset not found');

    return prisma.$transaction(async (tx) => {
      const asset = await tx.asset.update({
        where: { id: input.id },
        data: {
          branchId: input.branchId,
          categoryId: input.categoryId || null,
          name: input.name,
          description: input.description || null,
          serialNumber: input.serialNumber || null,
          location: input.location || null,
          assignedTo: input.assignedTo || null,
          condition: input.condition,
          status: input.status,
          purchaseDate: input.purchaseDate,
          purchaseCost: new Prisma.Decimal(input.purchaseCost),
          salvageValue: new Prisma.Decimal(input.salvageValue),
          usefulLifeMonths: input.usefulLifeMonths,
          depreciationMethod: input.depreciationMethod,
          notes: input.notes || null,
        },
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: asset.branchId,
          module: 'assets',
          action: 'update',
          entityType: 'Asset',
          entityId: asset.id,
          before: { name: existing.name, status: existing.status },
          after: { name: asset.name, status: asset.status },
        },
        tx,
      );

      return asset;
    });
  },

  async transfer(session: AppSession | null, input: AssetTransferInput) {
    const actor = await authorize(session, 'assets:transfer');
    const asset = await prisma.asset.findUnique({ where: { id: input.assetId } });
    if (!asset) throw new NotFoundError('Asset not found');
    if (asset.status === 'DISPOSED') {
      throw new ValidationError('Cannot transfer a disposed asset');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.asset.update({
        where: { id: asset.id },
        data: {
          branchId: input.toBranchId || asset.branchId,
          location: input.toLocation || asset.location,
          assignedTo: input.toAssignee || asset.assignedTo,
        },
      });

      await tx.assetMovement.create({
        data: {
          assetId: asset.id,
          branchId: updated.branchId,
          type: 'TRANSFER',
          fromLocation: asset.location,
          toLocation: updated.location,
          fromAssignee: asset.assignedTo,
          toAssignee: updated.assignedTo,
          note: input.note || null,
          createdById: actor.userId,
        },
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: updated.branchId,
          module: 'assets',
          action: 'transfer',
          entityType: 'Asset',
          entityId: asset.id,
          before: {
            branchId: asset.branchId,
            location: asset.location,
            assignedTo: asset.assignedTo,
          },
          after: {
            branchId: updated.branchId,
            location: updated.location,
            assignedTo: updated.assignedTo,
          },
        },
        tx,
      );

      return updated;
    });
  },

  async dispose(session: AppSession | null, input: AssetDisposeInput) {
    const actor = await authorize(session, 'assets:dispose');
    const asset = await prisma.asset.findUnique({ where: { id: input.assetId } });
    if (!asset) throw new NotFoundError('Asset not found');
    if (asset.status === 'DISPOSED') throw new ValidationError('Asset already disposed');

    return prisma.$transaction(async (tx) => {
      const disposalValue = new Prisma.Decimal(input.disposalValue);
      const updated = await tx.asset.update({
        where: { id: asset.id },
        data: {
          status: 'DISPOSED',
          disposedAt: input.disposedAt,
          disposalValue,
          disposalReason: input.disposalReason,
        },
      });

      await tx.assetMovement.create({
        data: {
          assetId: asset.id,
          branchId: asset.branchId,
          type: 'DISPOSAL',
          amount: disposalValue,
          note: input.disposalReason,
          createdById: actor.userId,
        },
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: asset.branchId,
          module: 'assets',
          action: 'dispose',
          entityType: 'Asset',
          entityId: asset.id,
          before: { status: asset.status },
          after: {
            status: updated.status,
            disposalValue: disposalValue.toString(),
            reason: input.disposalReason,
          },
        },
        tx,
      );

      return updated;
    });
  },

  async depreciate(session: AppSession | null, input: AssetDepreciateInput) {
    const actor = await authorize(session, 'assets:depreciate');
    const asset = await prisma.asset.findUnique({ where: { id: input.assetId } });
    if (!asset) throw new NotFoundError('Asset not found');
    if (asset.status === 'DISPOSED') {
      throw new ValidationError('Disposed assets cannot be depreciated');
    }

    const expense = computeDepreciation(asset, input.periodEnd);
    if (expense.lte(0)) {
      return { asset, posted: new Prisma.Decimal(0) };
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.asset.update({
        where: { id: asset.id },
        data: {
          accumulatedDepreciation: asset.accumulatedDepreciation.plus(expense),
          lastDepreciatedAt: input.periodEnd,
        },
      });

      await tx.assetMovement.create({
        data: {
          assetId: asset.id,
          branchId: asset.branchId,
          type: 'DEPRECIATION',
          amount: expense,
          note: `Depreciation through ${input.periodEnd.toISOString().slice(0, 10)}`,
          createdById: actor.userId,
        },
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: asset.branchId,
          module: 'assets',
          action: 'depreciate',
          entityType: 'Asset',
          entityId: asset.id,
          after: {
            expense: expense.toString(),
            accumulated: updated.accumulatedDepreciation.toString(),
            through: input.periodEnd.toISOString(),
          },
        },
        tx,
      );

      return { asset: updated, posted: expense };
    });
  },

  async depreciateBulk(session: AppSession | null, input: AssetDepreciateBulkInput) {
    await authorize(session, 'assets:depreciate');
    const assets = await prisma.asset.findMany({
      where: {
        status: { not: 'DISPOSED' },
        depreciationMethod: { not: 'NONE' },
        branchId: input.branchId || undefined,
      },
    });
    let postedCount = 0;
    let totalExpense = new Prisma.Decimal(0);
    for (const a of assets) {
      const { posted } = await this.depreciate(session, {
        assetId: a.id,
        periodEnd: input.periodEnd,
      });
      if (posted.gt(0)) {
        postedCount += 1;
        totalExpense = totalExpense.plus(posted);
      }
    }
    return { postedCount, totalExpense, assetsConsidered: assets.length };
  },

  async summary(session: AppSession | null, branchId?: string) {
    await authorize(session, 'assets:read');
    const where: Prisma.AssetWhereInput = branchId ? { branchId } : {};
    const [inUse, storage, maintenance, disposed, totals] = await Promise.all([
      prisma.asset.count({ where: { ...where, status: 'IN_USE' } }),
      prisma.asset.count({ where: { ...where, status: 'IN_STORAGE' } }),
      prisma.asset.count({ where: { ...where, status: 'UNDER_MAINTENANCE' } }),
      prisma.asset.count({ where: { ...where, status: 'DISPOSED' } }),
      prisma.asset.aggregate({
        where,
        _sum: { purchaseCost: true, accumulatedDepreciation: true },
      }),
    ]);
    const purchase = totals._sum.purchaseCost ?? new Prisma.Decimal(0);
    const accumulated = totals._sum.accumulatedDepreciation ?? new Prisma.Decimal(0);
    return {
      inUse,
      storage,
      maintenance,
      disposed,
      totalPurchase: purchase,
      totalAccumulated: accumulated,
      netBookValue: purchase.minus(accumulated),
    };
  },
};
