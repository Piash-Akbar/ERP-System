import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { authorize } from '@/server/auth/authorize';
import { recordAudit } from '@/server/audit/logger';
import type { AppSession } from '@/server/auth/session';
import { NotFoundError, ValidationError } from '@/lib/errors';

export type MovementItem = {
  productId: string;
  quantity: string; // decimal string
  costPerUnit?: string; // decimal string; optional for OUT flows
  note?: string;
};

export type ReceiptInput = {
  branchId: string;
  warehouseId: string;
  refType: string; // e.g. 'GRN' | 'MANUAL_ADJUST' | 'OPENING'
  refId?: string;
  note?: string;
  items: MovementItem[];
};

export type IssueInput = {
  branchId: string;
  warehouseId: string;
  refType: string; // e.g. 'SALE' | 'DAMAGE' | 'MANUAL_ADJUST'
  refId?: string;
  note?: string;
  items: MovementItem[];
};

export type TransferInput = {
  branchId: string; // source branch (transfers happen within a branch for now)
  fromWarehouseId: string;
  toWarehouseId: string;
  note?: string;
  items: MovementItem[];
};

export type PhysicalCountInput = {
  branchId: string;
  warehouseId: string;
  note?: string;
  items: { productId: string; countedQuantity: string; costPerUnit?: string }[];
};

type BalanceRow = { productId: string; warehouseId: string; balance: Prisma.Decimal };

function assertPositiveItems(items: MovementItem[]) {
  if (items.length === 0) throw new ValidationError('At least one item is required');
  for (const it of items) {
    if (!it.productId) throw new ValidationError('Missing product');
    const q = new Prisma.Decimal(it.quantity || 0);
    if (q.lte(0)) throw new ValidationError('Each quantity must be greater than zero');
  }
}

async function getBalances(
  tx: Prisma.TransactionClient | typeof prisma,
  branchId: string,
  warehouseId?: string,
  productIds?: string[],
): Promise<BalanceRow[]> {
  const params: unknown[] = [branchId];
  let where = `"branchId" = $1`;
  if (warehouseId) {
    params.push(warehouseId);
    where += ` AND "warehouseId" = $${params.length}`;
  }
  if (productIds && productIds.length > 0) {
    params.push(productIds);
    where += ` AND "productId" = ANY($${params.length})`;
  }
  const rows = await tx.$queryRawUnsafe<BalanceRow[]>(
    `SELECT "productId", "warehouseId",
            SUM(CASE WHEN direction = 'IN' THEN quantity ELSE -quantity END)::numeric AS balance
       FROM "InventoryLedger"
      WHERE ${where}
      GROUP BY "productId", "warehouseId"`,
    ...params,
  );
  return rows.map((r) => ({
    productId: r.productId,
    warehouseId: r.warehouseId,
    balance: new Prisma.Decimal(r.balance ?? 0),
  }));
}

export const stockService = {
  async balanceSnapshot(session: AppSession | null, branchId: string, warehouseId?: string) {
    await authorize(session, 'inventory:read');
    return getBalances(prisma, branchId, warehouseId);
  },

  async listMovements(
    session: AppSession | null,
    filters: {
      branchId?: string;
      warehouseId?: string;
      productId?: string;
      direction?: 'IN' | 'OUT';
      refType?: string;
      from?: Date;
      to?: Date;
      limit?: number;
    },
  ) {
    await authorize(session, 'inventory:read');
    return prisma.inventoryLedger.findMany({
      where: {
        branchId: filters.branchId,
        warehouseId: filters.warehouseId,
        productId: filters.productId,
        direction: filters.direction,
        refType: filters.refType,
        createdAt: {
          gte: filters.from,
          lte: filters.to,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 200,
      include: {
        product: { select: { sku: true, name: true, unit: true } },
        warehouse: { select: { code: true, name: true } },
      },
    });
  },

  async postReceipt(session: AppSession | null, input: ReceiptInput) {
    const actor = await authorize(session, 'warehouse:receive');
    assertPositiveItems(input.items);
    const warehouse = await prisma.warehouse.findUnique({ where: { id: input.warehouseId } });
    if (!warehouse || warehouse.branchId !== input.branchId) {
      throw new ValidationError('Warehouse does not belong to this branch');
    }

    return prisma.$transaction(async (tx) => {
      const created = await Promise.all(
        input.items.map((it) =>
          tx.inventoryLedger.create({
            data: {
              branchId: input.branchId,
              warehouseId: input.warehouseId,
              productId: it.productId,
              direction: 'IN',
              quantity: new Prisma.Decimal(it.quantity),
              costPerUnit: new Prisma.Decimal(it.costPerUnit ?? '0'),
              refType: input.refType,
              refId: input.refId ?? null,
              note: it.note ?? input.note ?? null,
              createdById: actor.userId,
            },
          }),
        ),
      );
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: input.branchId,
          module: 'warehouse',
          action: 'receive',
          entityType: 'InventoryLedger',
          entityId: null,
          after: {
            warehouseId: input.warehouseId,
            refType: input.refType,
            refId: input.refId ?? null,
            itemCount: input.items.length,
            totalQty: input.items
              .reduce((acc, it) => acc.plus(new Prisma.Decimal(it.quantity)), new Prisma.Decimal(0))
              .toString(),
          },
        },
        tx,
      );
      return { count: created.length };
    });
  },

  async postIssue(session: AppSession | null, input: IssueInput) {
    const actor = await authorize(session, 'warehouse:issue');
    assertPositiveItems(input.items);

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: input.warehouseId },
      include: { branch: { select: { allowNegativeStock: true } } },
    });
    if (!warehouse || warehouse.branchId !== input.branchId) {
      throw new ValidationError('Warehouse does not belong to this branch');
    }

    return prisma.$transaction(async (tx) => {
      const productIds = input.items.map((it) => it.productId);
      const balances = await getBalances(tx, input.branchId, input.warehouseId, productIds);
      const balanceByProduct = new Map(balances.map((b) => [b.productId, b.balance]));

      if (!warehouse.branch.allowNegativeStock) {
        for (const it of input.items) {
          const current = balanceByProduct.get(it.productId) ?? new Prisma.Decimal(0);
          const qty = new Prisma.Decimal(it.quantity);
          if (current.minus(qty).lt(0)) {
            const prod = await tx.product.findUnique({
              where: { id: it.productId },
              select: { sku: true },
            });
            throw new ValidationError(
              `Insufficient stock for ${prod?.sku ?? it.productId}: have ${current.toString()}, need ${qty.toString()}`,
            );
          }
        }
      }

      const created = await Promise.all(
        input.items.map((it) =>
          tx.inventoryLedger.create({
            data: {
              branchId: input.branchId,
              warehouseId: input.warehouseId,
              productId: it.productId,
              direction: 'OUT',
              quantity: new Prisma.Decimal(it.quantity),
              costPerUnit: new Prisma.Decimal(it.costPerUnit ?? '0'),
              refType: input.refType,
              refId: input.refId ?? null,
              note: it.note ?? input.note ?? null,
              createdById: actor.userId,
            },
          }),
        ),
      );

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: input.branchId,
          module: 'warehouse',
          action: 'issue',
          entityType: 'InventoryLedger',
          entityId: null,
          after: {
            warehouseId: input.warehouseId,
            refType: input.refType,
            refId: input.refId ?? null,
            itemCount: input.items.length,
          },
        },
        tx,
      );
      return { count: created.length };
    });
  },

  async postTransfer(session: AppSession | null, input: TransferInput) {
    const actor = await authorize(session, 'warehouse:transfer');
    assertPositiveItems(input.items);
    if (input.fromWarehouseId === input.toWarehouseId) {
      throw new ValidationError('Source and destination warehouses must differ');
    }

    const [from, to] = await Promise.all([
      prisma.warehouse.findUnique({
        where: { id: input.fromWarehouseId },
        include: { branch: { select: { allowNegativeStock: true } } },
      }),
      prisma.warehouse.findUnique({ where: { id: input.toWarehouseId } }),
    ]);
    if (!from || !to) throw new NotFoundError('Warehouse not found');
    if (from.branchId !== input.branchId || to.branchId !== input.branchId) {
      throw new ValidationError('Cross-branch transfers are not supported yet');
    }

    return prisma.$transaction(async (tx) => {
      const productIds = input.items.map((it) => it.productId);
      const balances = await getBalances(tx, input.branchId, input.fromWarehouseId, productIds);
      const balanceByProduct = new Map(balances.map((b) => [b.productId, b.balance]));

      if (!from.branch.allowNegativeStock) {
        for (const it of input.items) {
          const current = balanceByProduct.get(it.productId) ?? new Prisma.Decimal(0);
          const qty = new Prisma.Decimal(it.quantity);
          if (current.minus(qty).lt(0)) {
            throw new ValidationError(
              `Insufficient stock in source warehouse for product ${it.productId}: have ${current.toString()}, need ${qty.toString()}`,
            );
          }
        }
      }

      const refId = `TRN-${Date.now()}`;
      await Promise.all(
        input.items.flatMap((it) => [
          tx.inventoryLedger.create({
            data: {
              branchId: input.branchId,
              warehouseId: input.fromWarehouseId,
              productId: it.productId,
              direction: 'OUT',
              quantity: new Prisma.Decimal(it.quantity),
              costPerUnit: new Prisma.Decimal(it.costPerUnit ?? '0'),
              refType: 'TRANSFER',
              refId,
              note: input.note ?? null,
              createdById: actor.userId,
            },
          }),
          tx.inventoryLedger.create({
            data: {
              branchId: input.branchId,
              warehouseId: input.toWarehouseId,
              productId: it.productId,
              direction: 'IN',
              quantity: new Prisma.Decimal(it.quantity),
              costPerUnit: new Prisma.Decimal(it.costPerUnit ?? '0'),
              refType: 'TRANSFER',
              refId,
              note: input.note ?? null,
              createdById: actor.userId,
            },
          }),
        ]),
      );

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: input.branchId,
          module: 'warehouse',
          action: 'transfer',
          entityType: 'InventoryLedger',
          entityId: null,
          after: {
            refId,
            fromWarehouseId: input.fromWarehouseId,
            toWarehouseId: input.toWarehouseId,
            itemCount: input.items.length,
          },
        },
        tx,
      );

      return { refId, count: input.items.length };
    });
  },

  async postPhysicalCount(session: AppSession | null, input: PhysicalCountInput) {
    const actor = await authorize(session, 'warehouse:count');
    if (input.items.length === 0) throw new ValidationError('No items counted');

    const warehouse = await prisma.warehouse.findUnique({ where: { id: input.warehouseId } });
    if (!warehouse || warehouse.branchId !== input.branchId) {
      throw new ValidationError('Warehouse does not belong to this branch');
    }

    return prisma.$transaction(async (tx) => {
      const productIds = input.items.map((i) => i.productId);
      const balances = await getBalances(tx, input.branchId, input.warehouseId, productIds);
      const balanceByProduct = new Map(balances.map((b) => [b.productId, b.balance]));

      const refId = `PC-${Date.now()}`;
      let adjustmentsPosted = 0;

      for (const it of input.items) {
        const counted = new Prisma.Decimal(it.countedQuantity);
        if (counted.lt(0)) throw new ValidationError('Counted quantity cannot be negative');
        const current = balanceByProduct.get(it.productId) ?? new Prisma.Decimal(0);
        const delta = counted.minus(current);
        if (delta.eq(0)) continue;

        await tx.inventoryLedger.create({
          data: {
            branchId: input.branchId,
            warehouseId: input.warehouseId,
            productId: it.productId,
            direction: delta.gt(0) ? 'IN' : 'OUT',
            quantity: delta.abs(),
            costPerUnit: new Prisma.Decimal(it.costPerUnit ?? '0'),
            refType: 'PHYSICAL_COUNT',
            refId,
            note: input.note ?? null,
            createdById: actor.userId,
          },
        });
        adjustmentsPosted += 1;
      }

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: input.branchId,
          module: 'warehouse',
          action: 'count',
          entityType: 'InventoryLedger',
          entityId: null,
          after: {
            refId,
            warehouseId: input.warehouseId,
            itemsCounted: input.items.length,
            adjustmentsPosted,
          },
        },
        tx,
      );

      return { refId, adjustmentsPosted, itemsCounted: input.items.length };
    });
  },
};
