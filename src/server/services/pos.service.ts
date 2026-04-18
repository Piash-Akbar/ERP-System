import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { authorize } from '@/server/auth/authorize';
import { recordAudit } from '@/server/audit/logger';
import type { AppSession } from '@/server/auth/session';
import { NotFoundError, ValidationError, ForbiddenError } from '@/lib/errors';
import { nextDocumentNumber } from '@/lib/document-number';
import {
  POS_DISCOUNT_APPROVAL_THRESHOLD,
  type OpenSessionInput,
  type CloseSessionInput,
  type CreateSaleInput,
  type RefundSaleInput,
} from '@/server/validators/pos';

const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);
const ZERO = new Prisma.Decimal(0);

function computeLine(item: {
  quantity: number;
  unitPrice: number;
  discountRate: number;
  taxRate: number;
}) {
  const qty = D(item.quantity);
  const price = D(item.unitPrice);
  const gross = qty.mul(price);
  const discount = gross.mul(D(item.discountRate)).div(100);
  const net = gross.minus(discount);
  const tax = net.mul(D(item.taxRate)).div(100);
  return { gross, discount, net, tax, lineTotal: net.plus(tax) };
}

export const posService = {
  async currentSession(session: AppSession | null, branchId: string, warehouseId: string) {
    await authorize(session, 'pos:sell');
    return prisma.posSession.findFirst({
      where: { branchId, warehouseId, status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
      include: { warehouse: { select: { name: true, code: true } } },
    });
  },

  async mySessions(session: AppSession | null, limit = 20) {
    const actor = await authorize(session, 'pos:sell');
    return prisma.posSession.findMany({
      where: { cashierId: actor.userId },
      orderBy: { openedAt: 'desc' },
      take: limit,
      include: { warehouse: { select: { name: true, code: true } } },
    });
  },

  async openSession(session: AppSession | null, input: OpenSessionInput) {
    const actor = await authorize(session, 'pos:sell');
    const existing = await prisma.posSession.findFirst({
      where: { cashierId: actor.userId, status: 'OPEN' },
    });
    if (existing) throw new ValidationError('You already have an open session. Close it first.');

    const warehouse = await prisma.warehouse.findUnique({ where: { id: input.warehouseId } });
    if (!warehouse || warehouse.branchId !== input.branchId) {
      throw new ValidationError('Warehouse does not belong to this branch');
    }

    return prisma.$transaction(async (tx) => {
      const created = await tx.posSession.create({
        data: {
          branchId: input.branchId,
          warehouseId: input.warehouseId,
          cashierId: actor.userId,
          openingFloat: D(input.openingFloat),
          notes: input.notes || null,
        },
      });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: input.branchId,
          module: 'pos',
          action: 'open-session',
          entityType: 'PosSession',
          entityId: created.id,
          after: { openingFloat: created.openingFloat.toString() },
        },
        tx,
      );
      return created;
    });
  },

  async closeSession(session: AppSession | null, input: CloseSessionInput) {
    const actor = await authorize(session, 'pos:close-session');
    const existing = await prisma.posSession.findUnique({ where: { id: input.sessionId } });
    if (!existing) throw new NotFoundError('Session not found');
    if (existing.status !== 'OPEN') throw new ValidationError('Session is not open');

    // Expected cash = opening float + sum(cash payments) − sum(cash refunds)
    const [cashPayments, cashRefunds] = await Promise.all([
      prisma.posSalePayment.aggregate({
        _sum: { amount: true },
        where: { method: 'CASH', sale: { sessionId: existing.id, status: { not: 'VOIDED' } } },
      }),
      prisma.posReturn.aggregate({
        _sum: { refundAmount: true },
        where: { sessionId: existing.id, refundMethod: 'CASH', status: 'COMPLETED' },
      }),
    ]);
    const expected = existing.openingFloat
      .plus(cashPayments._sum.amount ?? ZERO)
      .minus(cashRefunds._sum.refundAmount ?? ZERO);
    const counted = D(input.countedCash);
    const variance = counted.minus(expected);

    return prisma.$transaction(async (tx) => {
      const closed = await tx.posSession.update({
        where: { id: input.sessionId },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          expectedCash: expected,
          countedCash: counted,
          cashVariance: variance,
          notes: input.notes || existing.notes,
        },
      });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: existing.branchId,
          module: 'pos',
          action: 'close-session',
          entityType: 'PosSession',
          entityId: closed.id,
          before: { status: existing.status },
          after: {
            expectedCash: expected.toString(),
            countedCash: counted.toString(),
            variance: variance.toString(),
          },
        },
        tx,
      );
      return closed;
    });
  },

  async createSale(session: AppSession | null, input: CreateSaleInput) {
    const actor = await authorize(session, 'pos:sell');
    const canOverride = actor.permissions.includes('pos:discount-override');

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: input.warehouseId },
      include: { branch: { select: { allowNegativeStock: true, currency: true } } },
    });
    if (!warehouse || warehouse.branchId !== input.branchId) {
      throw new ValidationError('Warehouse does not belong to this branch');
    }

    // Enforce discount approval
    for (const it of input.items) {
      if (it.discountRate > POS_DISCOUNT_APPROVAL_THRESHOLD && !canOverride) {
        throw new ForbiddenError(
          `Discount ${it.discountRate}% exceeds ${POS_DISCOUNT_APPROVAL_THRESHOLD}% — requires approval`,
        );
      }
    }

    let sessionRecord = null;
    if (input.sessionId) {
      sessionRecord = await prisma.posSession.findUnique({ where: { id: input.sessionId } });
      if (!sessionRecord || sessionRecord.status !== 'OPEN') {
        throw new ValidationError('POS session is not open');
      }
      if (sessionRecord.cashierId !== actor.userId) {
        throw new ForbiddenError('Session belongs to another cashier');
      }
    }

    // Customer check for CREDIT payments
    const hasCredit = input.payments.some((p) => p.method === 'CREDIT' && p.amount > 0);
    if (hasCredit && !input.customerId) {
      throw new ValidationError('Credit payment requires a customer');
    }
    let customer = null;
    if (input.customerId) {
      customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
      if (!customer) throw new NotFoundError('Customer not found');
    }

    // Totals
    let subtotal = ZERO;
    let discountTotal = ZERO;
    let taxTotal = ZERO;
    let grandTotal = ZERO;
    const computed = input.items.map((it) => {
      const c = computeLine(it);
      subtotal = subtotal.plus(c.gross);
      discountTotal = discountTotal.plus(c.discount);
      taxTotal = taxTotal.plus(c.tax);
      grandTotal = grandTotal.plus(c.lineTotal);
      return { ...it, ...c };
    });

    const paidTotal = input.payments.reduce((a, p) => a.plus(D(p.amount)), ZERO);
    const creditAmount = input.payments
      .filter((p) => p.method === 'CREDIT')
      .reduce((a, p) => a.plus(D(p.amount)), ZERO);
    const cashPaid = input.payments
      .filter((p) => p.method === 'CASH')
      .reduce((a, p) => a.plus(D(p.amount)), ZERO);

    if (paidTotal.lt(grandTotal)) {
      throw new ValidationError(
        `Underpaid: total ${grandTotal.toString()}, paid ${paidTotal.toString()}`,
      );
    }
    // Change only applies to cash overpay
    const changeDue = cashPaid.gt(ZERO) ? paidTotal.minus(grandTotal) : ZERO;
    if (changeDue.gt(cashPaid)) {
      throw new ValidationError('Change exceeds cash tendered');
    }

    return prisma.$transaction(async (tx) => {
      // Negative-stock guard
      if (!warehouse.branch.allowNegativeStock) {
        const productIds = input.items.map((i) => i.productId);
        const balances = await tx.$queryRaw<
          { productId: string; balance: string }[]
        >`SELECT "productId",
                  SUM(CASE WHEN direction = 'IN' THEN quantity ELSE -quantity END)::text AS balance
             FROM "InventoryLedger"
            WHERE "branchId" = ${input.branchId}
              AND "warehouseId" = ${input.warehouseId}
              AND "productId" = ANY(${productIds}::text[])
            GROUP BY "productId"`;
        const balMap = new Map(balances.map((b) => [b.productId, D(b.balance)]));
        for (const it of input.items) {
          const bal = balMap.get(it.productId) ?? ZERO;
          if (bal.lt(D(it.quantity))) {
            const p = await tx.product.findUnique({
              where: { id: it.productId },
              select: { sku: true, name: true },
            });
            throw new ValidationError(
              `Insufficient stock for ${p?.sku ?? it.productId}: have ${bal.toString()}, need ${it.quantity}`,
            );
          }
        }
      }

      const year = new Date().getFullYear();
      const count = await tx.posSale.count({ where: { branchId: input.branchId } });
      const number = nextDocumentNumber('POS', year, count, 6);

      const sale = await tx.posSale.create({
        data: {
          number,
          branchId: input.branchId,
          warehouseId: input.warehouseId,
          sessionId: sessionRecord?.id ?? null,
          customerId: customer?.id ?? null,
          cashierId: actor.userId,
          currency: warehouse.branch.currency,
          subtotal,
          discountTotal,
          taxTotal,
          grandTotal,
          paidTotal,
          changeDue,
          creditAmount,
          notes: input.notes || null,
          items: {
            create: computed.map((c) => ({
              productId: c.productId,
              description: c.description || null,
              quantity: D(c.quantity),
              unitPrice: D(c.unitPrice),
              discountRate: D(c.discountRate),
              taxRate: D(c.taxRate),
              lineTotal: c.lineTotal,
            })),
          },
          payments: {
            create: input.payments.map((p) => ({
              method: p.method,
              amount: D(p.amount),
              reference: p.reference || null,
            })),
          },
        },
        include: { items: true, payments: true },
      });

      // Inventory OUT per item
      await Promise.all(
        sale.items.map((li) =>
          tx.inventoryLedger.create({
            data: {
              branchId: input.branchId,
              warehouseId: input.warehouseId,
              productId: li.productId,
              direction: 'OUT',
              quantity: li.quantity,
              costPerUnit: ZERO,
              refType: 'POS_SALE',
              refId: sale.id,
              createdById: actor.userId,
            },
          }),
        ),
      );

      // Customer ledger: debit full amount, credit non-credit portion
      if (customer) {
        await tx.customerLedger.create({
          data: {
            branchId: input.branchId,
            customerId: customer.id,
            entryType: 'INVOICE',
            refType: 'PosSale',
            refId: sale.id,
            description: `POS sale ${sale.number}`,
            debit: grandTotal,
            credit: ZERO,
            createdById: actor.userId,
          },
        });
        const nonCredit = paidTotal.minus(creditAmount).minus(changeDue);
        if (nonCredit.gt(ZERO)) {
          await tx.customerLedger.create({
            data: {
              branchId: input.branchId,
              customerId: customer.id,
              entryType: 'PAYMENT',
              refType: 'PosSale',
              refId: sale.id,
              description: `POS payment ${sale.number}`,
              debit: ZERO,
              credit: nonCredit,
              createdById: actor.userId,
            },
          });
        }
      }

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: input.branchId,
          module: 'pos',
          action: 'sell',
          entityType: 'PosSale',
          entityId: sale.id,
          after: {
            number: sale.number,
            grandTotal: grandTotal.toString(),
            items: sale.items.length,
            credit: creditAmount.toString(),
          },
        },
        tx,
      );

      return sale;
    });
  },

  async refundSale(session: AppSession | null, input: RefundSaleInput) {
    const actor = await authorize(session, 'pos:refund');
    const sale = await prisma.posSale.findUnique({
      where: { id: input.saleId },
      include: { items: true, customer: true },
    });
    if (!sale) throw new NotFoundError('Sale not found');
    if (sale.status === 'VOIDED') throw new ValidationError('Sale is voided');

    const itemMap = new Map(sale.items.map((i) => [i.id, i]));
    for (const r of input.items) {
      const orig = itemMap.get(r.saleItemId);
      if (!orig) throw new ValidationError('Line not in this sale');
      const remaining = orig.quantity.minus(orig.returnedQty);
      if (D(r.quantity).gt(remaining)) {
        throw new ValidationError(
          `Cannot return ${r.quantity} — only ${remaining.toString()} remain on that line`,
        );
      }
    }

    return prisma.$transaction(async (tx) => {
      let refundAmount = ZERO;
      const returnItems: { saleItemId: string; productId: string; qty: Prisma.Decimal; unitPrice: Prisma.Decimal; lineTotal: Prisma.Decimal }[] = [];

      for (const r of input.items) {
        const orig = itemMap.get(r.saleItemId)!;
        const qty = D(r.quantity);
        // Refund at net line rate (incl. discount + tax) proportional to qty
        const perUnit = orig.lineTotal.div(orig.quantity);
        const lineRefund = perUnit.mul(qty);
        refundAmount = refundAmount.plus(lineRefund);
        returnItems.push({
          saleItemId: orig.id,
          productId: orig.productId,
          qty,
          unitPrice: orig.unitPrice,
          lineTotal: lineRefund,
        });
        await tx.posSaleItem.update({
          where: { id: orig.id },
          data: { returnedQty: orig.returnedQty.plus(qty) },
        });
      }

      const year = new Date().getFullYear();
      const count = await tx.posReturn.count({ where: { branchId: sale.branchId } });
      const number = nextDocumentNumber('POSR', year, count, 6);

      const ret = await tx.posReturn.create({
        data: {
          number,
          branchId: sale.branchId,
          warehouseId: sale.warehouseId,
          saleId: sale.id,
          sessionId: sale.sessionId,
          refundAmount,
          refundMethod: input.refundMethod,
          reason: input.reason || null,
          createdById: actor.userId,
          items: {
            create: returnItems.map((ri) => ({
              saleItemId: ri.saleItemId,
              productId: ri.productId,
              quantity: ri.qty,
              unitPrice: ri.unitPrice,
              lineTotal: ri.lineTotal,
            })),
          },
        },
      });

      // Inventory back IN
      await Promise.all(
        returnItems.map((ri) =>
          tx.inventoryLedger.create({
            data: {
              branchId: sale.branchId,
              warehouseId: sale.warehouseId,
              productId: ri.productId,
              direction: 'IN',
              quantity: ri.qty,
              costPerUnit: ZERO,
              refType: 'POS_RETURN',
              refId: ret.id,
              createdById: actor.userId,
            },
          }),
        ),
      );

      // Customer ledger credit for refund
      if (sale.customerId) {
        await tx.customerLedger.create({
          data: {
            branchId: sale.branchId,
            customerId: sale.customerId,
            entryType: 'RETURN',
            refType: 'PosReturn',
            refId: ret.id,
            description: `POS return ${ret.number}`,
            debit: ZERO,
            credit: refundAmount,
            createdById: actor.userId,
          },
        });
      }

      // Update sale status
      const totalReturned = sale.items.reduce(
        (acc, li) => {
          const addl = returnItems.find((r) => r.saleItemId === li.id)?.qty ?? ZERO;
          return acc.plus(li.returnedQty.plus(addl));
        },
        ZERO,
      );
      const totalOriginal = sale.items.reduce((a, li) => a.plus(li.quantity), ZERO);
      const newStatus = totalReturned.gte(totalOriginal) ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
      await tx.posSale.update({ where: { id: sale.id }, data: { status: newStatus } });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: sale.branchId,
          module: 'pos',
          action: 'refund',
          entityType: 'PosReturn',
          entityId: ret.id,
          after: {
            number: ret.number,
            saleNumber: sale.number,
            refundAmount: refundAmount.toString(),
            items: returnItems.length,
          },
        },
        tx,
      );

      return ret;
    });
  },

  async listSales(
    session: AppSession | null,
    filters: {
      branchId?: string;
      cashierId?: string;
      customerId?: string;
      sessionId?: string;
      status?: string;
      from?: Date;
      to?: Date;
      search?: string;
      limit?: number;
    } = {},
  ) {
    await authorize(session, 'pos:sell');
    return prisma.posSale.findMany({
      where: {
        branchId: filters.branchId,
        cashierId: filters.cashierId,
        customerId: filters.customerId,
        sessionId: filters.sessionId,
        status: filters.status as
          | 'COMPLETED'
          | 'VOIDED'
          | 'REFUNDED'
          | 'PARTIALLY_REFUNDED'
          | undefined,
        saleDate:
          filters.from || filters.to
            ? { gte: filters.from, lte: filters.to }
            : undefined,
        OR: filters.search
          ? [
              { number: { contains: filters.search, mode: 'insensitive' } },
              { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
            ]
          : undefined,
      },
      orderBy: { saleDate: 'desc' },
      take: filters.limit ?? 100,
      include: {
        customer: { select: { id: true, name: true, code: true } },
        _count: { select: { items: true, payments: true } },
      },
    });
  },

  async getSale(session: AppSession | null, id: string) {
    await authorize(session, 'pos:sell');
    const sale = await prisma.posSale.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { sku: true, name: true, unit: true } } } },
        payments: true,
        customer: { select: { id: true, name: true, code: true, currency: true } },
        warehouse: { select: { name: true, code: true } },
        returns: { include: { items: true } },
      },
    });
    if (!sale) throw new NotFoundError('Sale not found');
    return sale;
  },

  async searchProducts(session: AppSession | null, branchId: string, query: string, limit = 30) {
    await authorize(session, 'pos:sell');
    const q = query.trim();
    if (!q) {
      return prisma.product.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        take: limit,
        select: {
          id: true,
          sku: true,
          barcode: true,
          name: true,
          unit: true,
          sellPrice: true,
          taxRate: true,
          imageUrl: true,
        },
      });
    }
    return prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { sku: { equals: q, mode: 'insensitive' } },
          { barcode: { equals: q } },
          { name: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
      take: limit,
      select: {
        id: true,
        sku: true,
        barcode: true,
        name: true,
        unit: true,
        sellPrice: true,
        taxRate: true,
        imageUrl: true,
      },
    });
  },
};
