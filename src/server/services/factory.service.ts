import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { authorize } from '@/server/auth/authorize';
import { recordAudit } from '@/server/audit/logger';
import type { AppSession } from '@/server/auth/session';
import type {
  ProductionOrderCreateInput,
  ProductionConsumeInput,
  ProductionOutputInput,
  ProductionStageUpdateInput,
  ProductionOrderStatusInput,
  ProductionCostEntryCreateInput,
  ProductionCostEntryDeleteInput,
  ProductionOverheadRateInput,
} from '@/server/validators/factory';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { nextProductionNumber } from '@/lib/document-number';

const ORDER_INCLUDE = {
  branch: { select: { id: true, name: true, code: true, currency: true, allowNegativeStock: true } },
  product: { select: { id: true, sku: true, name: true, unit: true } },
  stages: { orderBy: { sequence: 'asc' as const } },
  materials: {
    include: {
      product: { select: { id: true, sku: true, name: true, unit: true, costPrice: true } },
      fromWarehouse: { select: { id: true, code: true, name: true } },
    },
  },
  outputs: {
    include: {
      toWarehouse: { select: { id: true, code: true, name: true } },
    },
    orderBy: { createdAt: 'desc' as const },
  },
  costEntries: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.ProductionOrderInclude;

async function balanceFor(
  tx: Prisma.TransactionClient,
  branchId: string,
  warehouseId: string,
  productId: string,
): Promise<Prisma.Decimal> {
  const rows = await tx.$queryRaw<{ balance: number | null }[]>`
    SELECT COALESCE(SUM(CASE WHEN direction = 'IN' THEN quantity ELSE -quantity END), 0)::numeric AS balance
      FROM "InventoryLedger"
     WHERE "branchId" = ${branchId} AND "warehouseId" = ${warehouseId} AND "productId" = ${productId}
  `;
  return new Prisma.Decimal(rows[0]?.balance ?? 0);
}

export interface ProductionCostSummary {
  materialCost: Prisma.Decimal;
  labourCost: Prisma.Decimal;
  fixedOverheadCost: Prisma.Decimal;
  percentOverheadCost: Prisma.Decimal;
  wedgeCost: Prisma.Decimal;
  totalCost: Prisma.Decimal;
  costPerUnit: Prisma.Decimal | null;
}

export function getCostSummary(params: {
  outputs: { quantity: Prisma.Decimal; costPerUnit: Prisma.Decimal }[];
  materials: { consumedQty: Prisma.Decimal; product: { costPrice: Prisma.Decimal } }[];
  costEntries: { type: string; amount: Prisma.Decimal }[];
  overheadRate: Prisma.Decimal | null;
  producedQty: Prisma.Decimal;
}): ProductionCostSummary {
  const ZERO = new Prisma.Decimal(0);

  const outputCost = params.outputs.reduce(
    (s, o) => s.plus(o.quantity.times(o.costPerUnit)),
    ZERO,
  );
  const materialCost = outputCost.gt(0)
    ? outputCost
    : params.materials.reduce(
        (s, m) => s.plus(m.consumedQty.times(m.product.costPrice)),
        ZERO,
      );

  const labourCost = params.costEntries
    .filter((e) => e.type === 'LABOUR')
    .reduce((s, e) => s.plus(e.amount), ZERO);

  const fixedOverheadCost = params.costEntries
    .filter((e) => e.type === 'OVERHEAD')
    .reduce((s, e) => s.plus(e.amount), ZERO);

  const wedgeCost = params.costEntries
    .filter((e) => e.type === 'WEDGE')
    .reduce((s, e) => s.plus(e.amount), ZERO);

  const percentOverheadCost = params.overheadRate
    ? materialCost.times(params.overheadRate).dividedBy(100)
    : ZERO;

  const totalCost = materialCost
    .plus(labourCost)
    .plus(fixedOverheadCost)
    .plus(percentOverheadCost)
    .plus(wedgeCost);

  const costPerUnit = params.producedQty.gt(0)
    ? totalCost.dividedBy(params.producedQty).toDecimalPlaces(4)
    : null;

  return { materialCost, labourCost, fixedOverheadCost, percentOverheadCost, wedgeCost, totalCost, costPerUnit };
}

export const factoryService = {
  async list(
    session: AppSession | null,
    filters: { branchId?: string; status?: string; search?: string } = {},
  ) {
    await authorize(session, 'factory:read');
    return prisma.productionOrder.findMany({
      where: {
        branchId: filters.branchId,
        status: filters.status as Prisma.ProductionOrderWhereInput['status'],
        OR: filters.search
          ? [
              { number: { contains: filters.search, mode: 'insensitive' } },
              { product: { name: { contains: filters.search, mode: 'insensitive' } } },
              { product: { sku: { contains: filters.search, mode: 'insensitive' } } },
            ]
          : undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        product: { select: { id: true, sku: true, name: true } },
      },
      take: 200,
    });
  },

  async getById(session: AppSession | null, id: string) {
    await authorize(session, 'factory:read');
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundError('Production order not found');
    return order;
  },

  async create(session: AppSession | null, input: ProductionOrderCreateInput) {
    const actor = await authorize(session, 'factory:plan');
    if (input.plannedEndDate < input.plannedStartDate) {
      throw new ValidationError('Planned end date cannot be before planned start date');
    }

    return prisma.$transaction(async (tx) => {
      const year = input.plannedStartDate.getFullYear();
      const count = await tx.productionOrder.count({
        where: { createdAt: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } },
      });
      const number = nextProductionNumber(year, count);

      const order = await tx.productionOrder.create({
        data: {
          branchId: input.branchId,
          number,
          productId: input.productId,
          plannedQty: new Prisma.Decimal(input.plannedQty),
          unit: input.unit,
          status: 'PLANNED',
          plannedStartDate: input.plannedStartDate,
          plannedEndDate: input.plannedEndDate,
          notes: input.notes || null,
          createdById: actor.userId,
          stages: {
            create: input.stages.map((s) => ({
              sequence: s.sequence,
              name: s.name,
              notes: s.notes || null,
            })),
          },
          materials: {
            create: input.materials.map((m) => ({
              productId: m.productId,
              unit: m.unit,
              plannedQty: new Prisma.Decimal(m.plannedQty),
              fromWarehouseId: m.fromWarehouseId || null,
              note: m.note || null,
            })),
          },
        },
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: order.branchId,
          module: 'factory',
          action: 'create',
          entityType: 'ProductionOrder',
          entityId: order.id,
          after: {
            number: order.number,
            productId: order.productId,
            plannedQty: order.plannedQty.toString(),
            materials: input.materials.length,
            stages: input.stages.length,
          },
        },
        tx,
      );

      return order;
    });
  },

  async consumeMaterials(session: AppSession | null, input: ProductionConsumeInput) {
    const actor = await authorize(session, 'factory:execute');
    const order = await prisma.productionOrder.findUnique({
      where: { id: input.orderId },
      include: { materials: true, branch: { select: { allowNegativeStock: true } } },
    });
    if (!order) throw new NotFoundError('Production order not found');
    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw new ValidationError(`Cannot consume materials on ${order.status.toLowerCase()} order`);
    }

    return prisma.$transaction(async (tx) => {
      for (const item of input.items) {
        const material = order.materials.find((m) => m.id === item.materialId);
        if (!material) throw new ValidationError('Unknown material line');
        if (!material.fromWarehouseId) {
          throw new ValidationError(
            'Material has no source warehouse — edit the order before issuing',
          );
        }

        const qty = new Prisma.Decimal(item.quantity);
        if (!order.branch.allowNegativeStock) {
          const current = await balanceFor(
            tx,
            order.branchId,
            material.fromWarehouseId,
            material.productId,
          );
          if (current.lt(qty)) {
            throw new ValidationError(
              `Insufficient stock for material ${material.productId}: have ${current}, need ${qty}`,
            );
          }
        }

        await tx.inventoryLedger.create({
          data: {
            branchId: order.branchId,
            warehouseId: material.fromWarehouseId,
            productId: material.productId,
            direction: 'OUT',
            quantity: qty,
            costPerUnit: new Prisma.Decimal(item.costPerUnit ?? 0),
            refType: 'PRODUCTION_CONSUMPTION',
            refId: order.id,
            note: `Consumption for ${order.number}`,
            createdById: actor.userId,
          },
        });

        await tx.productionMaterial.update({
          where: { id: material.id },
          data: { consumedQty: material.consumedQty.plus(qty) },
        });
      }

      if (order.status === 'PLANNED') {
        await tx.productionOrder.update({
          where: { id: order.id },
          data: { status: 'IN_PROGRESS', actualStartDate: new Date() },
        });
      }

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: order.branchId,
          module: 'factory',
          action: 'consume',
          entityType: 'ProductionOrder',
          entityId: order.id,
          after: { items: input.items.length },
        },
        tx,
      );

      return { count: input.items.length };
    });
  },

  async recordOutput(session: AppSession | null, input: ProductionOutputInput) {
    const actor = await authorize(session, 'factory:execute');
    const order = await prisma.productionOrder.findUnique({
      where: { id: input.orderId },
    });
    if (!order) throw new NotFoundError('Production order not found');
    if (order.status === 'CANCELLED') {
      throw new ValidationError('Cannot record output on a cancelled order');
    }

    const qty = new Prisma.Decimal(input.quantity);

    return prisma.$transaction(async (tx) => {
      const warehouse = await tx.warehouse.findUnique({ where: { id: input.toWarehouseId } });
      if (!warehouse || warehouse.branchId !== order.branchId) {
        throw new ValidationError('Target warehouse does not belong to this branch');
      }

      const output = await tx.productionOutput.create({
        data: {
          orderId: order.id,
          productId: order.productId,
          unit: order.unit,
          quantity: qty,
          costPerUnit: new Prisma.Decimal(input.costPerUnit ?? 0),
          toWarehouseId: input.toWarehouseId,
          note: input.note || null,
          createdById: actor.userId,
        },
      });

      await tx.inventoryLedger.create({
        data: {
          branchId: order.branchId,
          warehouseId: input.toWarehouseId,
          productId: order.productId,
          direction: 'IN',
          quantity: qty,
          costPerUnit: new Prisma.Decimal(input.costPerUnit ?? 0),
          refType: 'PRODUCTION_OUTPUT',
          refId: order.id,
          note: `Output for ${order.number}`,
          createdById: actor.userId,
        },
      });

      const newProduced = order.producedQty.plus(qty);
      const completed = newProduced.gte(order.plannedQty);
      await tx.productionOrder.update({
        where: { id: order.id },
        data: {
          producedQty: newProduced,
          status: completed ? 'COMPLETED' : 'IN_PROGRESS',
          actualEndDate: completed ? new Date() : order.actualEndDate,
          actualStartDate: order.actualStartDate ?? new Date(),
        },
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: order.branchId,
          module: 'factory',
          action: 'output',
          entityType: 'ProductionOrder',
          entityId: order.id,
          after: {
            outputId: output.id,
            qty: qty.toString(),
            toWarehouseId: input.toWarehouseId,
            completed,
          },
        },
        tx,
      );

      return output;
    });
  },

  async updateStage(session: AppSession | null, input: ProductionStageUpdateInput) {
    const actor = await authorize(session, 'factory:execute');
    const stage = await prisma.productionStage.findUnique({
      where: { id: input.stageId },
      include: { order: { select: { id: true, branchId: true, number: true } } },
    });
    if (!stage) throw new NotFoundError('Stage not found');

    const now = new Date();
    const updated = await prisma.productionStage.update({
      where: { id: stage.id },
      data: {
        status: input.status,
        notes: input.notes || null,
        startedAt:
          input.status === 'IN_PROGRESS' && !stage.startedAt ? now : stage.startedAt,
        completedAt:
          input.status === 'COMPLETED' ? now : stage.completedAt,
      },
    });

    await recordAudit({
      actorId: actor.userId,
      branchId: stage.order.branchId,
      module: 'factory',
      action: 'stage-update',
      entityType: 'ProductionStage',
      entityId: stage.id,
      before: { status: stage.status },
      after: { status: updated.status, orderNumber: stage.order.number },
    });

    return updated;
  },

  async updateStatus(session: AppSession | null, input: ProductionOrderStatusInput) {
    const actor = await authorize(session, 'factory:close');
    const order = await prisma.productionOrder.findUnique({ where: { id: input.orderId } });
    if (!order) throw new NotFoundError('Production order not found');

    const updated = await prisma.productionOrder.update({
      where: { id: order.id },
      data: {
        status: input.status,
        actualEndDate:
          input.status === 'COMPLETED' || input.status === 'CANCELLED'
            ? order.actualEndDate ?? new Date()
            : order.actualEndDate,
      },
    });

    await recordAudit({
      actorId: actor.userId,
      branchId: order.branchId,
      module: 'factory',
      action: 'status',
      entityType: 'ProductionOrder',
      entityId: order.id,
      before: { status: order.status },
      after: { status: updated.status },
    });

    return updated;
  },

  async summary(session: AppSession | null, branchId?: string) {
    await authorize(session, 'factory:read');
    const where: Prisma.ProductionOrderWhereInput = branchId ? { branchId } : {};
    const [planned, inProgress, completed, overdue] = await Promise.all([
      prisma.productionOrder.count({ where: { ...where, status: 'PLANNED' } }),
      prisma.productionOrder.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.productionOrder.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.productionOrder.count({
        where: {
          ...where,
          status: { in: ['PLANNED', 'IN_PROGRESS'] },
          plannedEndDate: { lt: new Date() },
        },
      }),
    ]);
    return { planned, inProgress, completed, overdue };
  },

  async addCostEntry(session: AppSession | null, input: ProductionCostEntryCreateInput) {
    const actor = await authorize(session, 'factory:execute');
    const order = await prisma.productionOrder.findUnique({ where: { id: input.orderId } });
    if (!order) throw new NotFoundError('Production order not found');
    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw new ValidationError(`Cannot add cost entries to a ${order.status.toLowerCase()} order`);
    }

    return prisma.$transaction(async (tx) => {
      let amount: Prisma.Decimal;
      let hours: Prisma.Decimal | null = null;
      let rate: Prisma.Decimal | null = null;

      if (input.type === 'LABOUR') {
        hours = new Prisma.Decimal(input.hours!);
        rate = new Prisma.Decimal(input.rate!);
        amount = hours.times(rate);
      } else {
        amount = new Prisma.Decimal(input.amount!);
      }

      const entry = await tx.productionCostEntry.create({
        data: {
          orderId: input.orderId,
          type: input.type,
          description: input.description,
          hours,
          rate,
          amount,
          note: input.note || null,
          createdById: actor.userId,
        },
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: order.branchId,
          module: 'factory',
          action: 'cost-entry-add',
          entityType: 'ProductionCostEntry',
          entityId: entry.id,
          after: {
            orderId: order.id,
            type: input.type,
            description: input.description,
            amount: amount.toString(),
          },
        },
        tx,
      );

      return entry;
    });
  },

  async deleteCostEntry(session: AppSession | null, input: ProductionCostEntryDeleteInput) {
    const actor = await authorize(session, 'factory:execute');
    const entry = await prisma.productionCostEntry.findUnique({
      where: { id: input.entryId },
      include: { order: { select: { id: true, branchId: true, status: true } } },
    });
    if (!entry) throw new NotFoundError('Cost entry not found');
    if (entry.orderId !== input.orderId) throw new ValidationError('Entry does not belong to this order');
    if (entry.order.status === 'COMPLETED' || entry.order.status === 'CANCELLED') {
      throw new ValidationError('Cannot delete cost entries on a closed order');
    }

    return prisma.$transaction(async (tx) => {
      await tx.productionCostEntry.delete({ where: { id: entry.id } });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: entry.order.branchId,
          module: 'factory',
          action: 'cost-entry-delete',
          entityType: 'ProductionCostEntry',
          entityId: entry.id,
          before: {
            type: entry.type,
            description: entry.description,
            amount: entry.amount.toString(),
          },
        },
        tx,
      );

      return { deleted: true };
    });
  },

  async updateOverheadRate(session: AppSession | null, input: ProductionOverheadRateInput) {
    const actor = await authorize(session, 'factory:execute');
    const order = await prisma.productionOrder.findUnique({ where: { id: input.orderId } });
    if (!order) throw new NotFoundError('Production order not found');
    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw new ValidationError('Cannot update overhead rate on a closed order');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.productionOrder.update({
        where: { id: order.id },
        data: { overheadRate: new Prisma.Decimal(input.overheadRate) },
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: order.branchId,
          module: 'factory',
          action: 'overhead-rate-update',
          entityType: 'ProductionOrder',
          entityId: order.id,
          before: { overheadRate: order.overheadRate?.toString() ?? null },
          after: { overheadRate: input.overheadRate.toString() },
        },
        tx,
      );

      return updated;
    });
  },
};
