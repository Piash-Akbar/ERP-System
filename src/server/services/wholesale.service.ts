import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { authorize } from '@/server/auth/authorize';
import { recordAudit } from '@/server/audit/logger';
import type { AppSession } from '@/server/auth/session';
import { NotFoundError, ValidationError, ForbiddenError } from '@/lib/errors';
import { nextDocumentNumber } from '@/lib/document-number';
import {
  WHOLESALE_DISCOUNT_APPROVAL_THRESHOLD,
  type CreateInvoiceInput,
  type RecordPaymentInput,
  type ReturnInvoiceInput,
  type VoidInvoiceInput,
} from '@/server/validators/wholesale';

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

function deriveStatus(grand: Prisma.Decimal, paid: Prisma.Decimal, dueDate: Date | null) {
  if (paid.gte(grand) && grand.gt(ZERO)) return 'PAID' as const;
  if (paid.gt(ZERO)) return 'PARTIALLY_PAID' as const;
  if (dueDate && dueDate.getTime() < Date.now()) return 'OVERDUE' as const;
  return 'CONFIRMED' as const;
}

export const wholesaleService = {
  async listInvoices(
    session: AppSession | null,
    filters: {
      branchId?: string;
      customerId?: string;
      status?: string;
      from?: Date;
      to?: Date;
      search?: string;
      limit?: number;
    } = {},
  ) {
    await authorize(session, 'wholesale:read');
    return prisma.wholesaleInvoice.findMany({
      where: {
        branchId: filters.branchId,
        customerId: filters.customerId,
        status: filters.status as
          | 'DRAFT'
          | 'CONFIRMED'
          | 'PARTIALLY_PAID'
          | 'PAID'
          | 'OVERDUE'
          | 'VOIDED'
          | 'PARTIALLY_RETURNED'
          | 'RETURNED'
          | undefined,
        invoiceDate:
          filters.from || filters.to ? { gte: filters.from, lte: filters.to } : undefined,
        OR: filters.search
          ? [
              { number: { contains: filters.search, mode: 'insensitive' } },
              { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
              { customer: { code: { contains: filters.search, mode: 'insensitive' } } },
            ]
          : undefined,
      },
      orderBy: { invoiceDate: 'desc' },
      take: filters.limit ?? 100,
      include: {
        customer: { select: { id: true, name: true, code: true } },
        _count: { select: { items: true, payments: true } },
      },
    });
  },

  async getInvoice(session: AppSession | null, id: string) {
    await authorize(session, 'wholesale:read');
    const inv = await prisma.wholesaleInvoice.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { sku: true, name: true, unit: true } } } },
        payments: { orderBy: { paidAt: 'desc' } },
        customer: { select: { id: true, code: true, name: true, currency: true, phone: true, email: true, creditLimit: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        returns: { include: { items: true }, orderBy: { returnDate: 'desc' } },
      },
    });
    if (!inv) throw new NotFoundError('Invoice not found');
    return inv;
  },

  async createInvoice(session: AppSession | null, input: CreateInvoiceInput) {
    const actor = await authorize(session, 'wholesale:write');
    const canOverride = actor.permissions.includes('wholesale:discount-override');

    const [warehouse, customer] = await Promise.all([
      prisma.warehouse.findUnique({
        where: { id: input.warehouseId },
        include: { branch: { select: { allowNegativeStock: true, currency: true } } },
      }),
      prisma.customer.findUnique({ where: { id: input.customerId } }),
    ]);
    if (!warehouse || warehouse.branchId !== input.branchId) {
      throw new ValidationError('Warehouse does not belong to this branch');
    }
    if (!customer) throw new NotFoundError('Customer not found');
    if (customer.status !== 'ACTIVE') throw new ValidationError('Customer is not active');
    if (customer.branchId !== input.branchId) {
      throw new ValidationError('Customer does not belong to this branch');
    }

    for (const it of input.items) {
      if (it.discountRate > WHOLESALE_DISCOUNT_APPROVAL_THRESHOLD && !canOverride) {
        throw new ForbiddenError(
          `Discount ${it.discountRate}% exceeds ${WHOLESALE_DISCOUNT_APPROVAL_THRESHOLD}% — requires approval`,
        );
      }
    }

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

    const paidTotal = input.initialPayments.reduce((a, p) => a.plus(D(p.amount)), ZERO);
    if (paidTotal.gt(grandTotal)) {
      throw new ValidationError('Initial payments exceed invoice total');
    }
    const balanceDue = grandTotal.minus(paidTotal);

    // Credit-limit check: outstanding customer balance + new balanceDue <= creditLimit
    if (balanceDue.gt(ZERO) && customer.creditLimit.gt(ZERO)) {
      const outstanding = await prisma.customerLedger.aggregate({
        where: { customerId: customer.id },
        _sum: { debit: true, credit: true },
      });
      const currentBal = (outstanding._sum.debit ?? ZERO).minus(outstanding._sum.credit ?? ZERO);
      if (currentBal.plus(balanceDue).gt(customer.creditLimit)) {
        throw new ValidationError(
          `Credit limit exceeded: ${currentBal.plus(balanceDue).toString()} > ${customer.creditLimit.toString()}`,
        );
      }
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
              select: { sku: true },
            });
            throw new ValidationError(
              `Insufficient stock for ${p?.sku ?? it.productId}: have ${bal.toString()}, need ${it.quantity}`,
            );
          }
        }
      }

      const year = new Date().getFullYear();
      const count = await tx.wholesaleInvoice.count({ where: { branchId: input.branchId } });
      const number = nextDocumentNumber('WS', year, count, 6);

      const status = deriveStatus(grandTotal, paidTotal, input.dueDate ?? null);

      const invoice = await tx.wholesaleInvoice.create({
        data: {
          number,
          branchId: input.branchId,
          warehouseId: input.warehouseId,
          customerId: customer.id,
          salesRepId: input.salesRepId || actor.userId,
          dueDate: input.dueDate ?? null,
          currency: warehouse.branch.currency,
          subtotal,
          discountTotal,
          taxTotal,
          grandTotal,
          paidTotal,
          balanceDue,
          status,
          notes: input.notes || null,
          createdById: actor.userId,
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
            create: input.initialPayments.map((p) => ({
              method: p.method,
              amount: D(p.amount),
              reference: p.reference || null,
              createdById: actor.userId,
            })),
          },
        },
        include: { items: true, payments: true },
      });

      // Inventory OUT per item
      await Promise.all(
        invoice.items.map((li) =>
          tx.inventoryLedger.create({
            data: {
              branchId: input.branchId,
              warehouseId: input.warehouseId,
              productId: li.productId,
              direction: 'OUT',
              quantity: li.quantity,
              costPerUnit: ZERO,
              refType: 'WHOLESALE_INVOICE',
              refId: invoice.id,
              createdById: actor.userId,
            },
          }),
        ),
      );

      // Customer ledger: invoice debit + payment credit (if any)
      await tx.customerLedger.create({
        data: {
          branchId: input.branchId,
          customerId: customer.id,
          entryType: 'INVOICE',
          refType: 'WholesaleInvoice',
          refId: invoice.id,
          description: `Wholesale invoice ${invoice.number}`,
          debit: grandTotal,
          credit: ZERO,
          createdById: actor.userId,
        },
      });
      if (paidTotal.gt(ZERO)) {
        await tx.customerLedger.create({
          data: {
            branchId: input.branchId,
            customerId: customer.id,
            entryType: 'PAYMENT',
            refType: 'WholesaleInvoice',
            refId: invoice.id,
            description: `Payment on ${invoice.number}`,
            debit: ZERO,
            credit: paidTotal,
            createdById: actor.userId,
          },
        });
      }

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: input.branchId,
          module: 'wholesale',
          action: 'create-invoice',
          entityType: 'WholesaleInvoice',
          entityId: invoice.id,
          after: {
            number: invoice.number,
            grandTotal: grandTotal.toString(),
            balanceDue: balanceDue.toString(),
            items: invoice.items.length,
          },
        },
        tx,
      );

      return invoice;
    });
  },

  async recordPayment(session: AppSession | null, input: RecordPaymentInput) {
    const actor = await authorize(session, 'wholesale:payment');
    const invoice = await prisma.wholesaleInvoice.findUnique({ where: { id: input.invoiceId } });
    if (!invoice) throw new NotFoundError('Invoice not found');
    if (invoice.status === 'VOIDED') throw new ValidationError('Invoice is voided');

    const amount = D(input.amount);
    if (amount.gt(invoice.balanceDue)) {
      throw new ValidationError(
        `Payment ${amount.toString()} exceeds balance due ${invoice.balanceDue.toString()}`,
      );
    }

    return prisma.$transaction(async (tx) => {
      const payment = await tx.wholesalePayment.create({
        data: {
          invoiceId: invoice.id,
          method: input.method,
          amount,
          reference: input.reference || null,
          paidAt: input.paidAt ?? new Date(),
          createdById: actor.userId,
        },
      });

      const newPaid = invoice.paidTotal.plus(amount);
      const newBalance = invoice.grandTotal.minus(newPaid);
      const newStatus =
        invoice.status === 'RETURNED' || invoice.status === 'PARTIALLY_RETURNED'
          ? invoice.status
          : deriveStatus(invoice.grandTotal, newPaid, invoice.dueDate);

      await tx.wholesaleInvoice.update({
        where: { id: invoice.id },
        data: { paidTotal: newPaid, balanceDue: newBalance, status: newStatus },
      });

      await tx.customerLedger.create({
        data: {
          branchId: invoice.branchId,
          customerId: invoice.customerId,
          entryType: 'PAYMENT',
          refType: 'WholesaleInvoice',
          refId: invoice.id,
          description: `Payment on ${invoice.number}`,
          debit: ZERO,
          credit: amount,
          createdById: actor.userId,
        },
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: invoice.branchId,
          module: 'wholesale',
          action: 'record-payment',
          entityType: 'WholesaleInvoice',
          entityId: invoice.id,
          before: { paidTotal: invoice.paidTotal.toString() },
          after: {
            amount: amount.toString(),
            paidTotal: newPaid.toString(),
            balanceDue: newBalance.toString(),
            method: input.method,
          },
        },
        tx,
      );

      return payment;
    });
  },

  async returnInvoice(session: AppSession | null, input: ReturnInvoiceInput) {
    const actor = await authorize(session, 'wholesale:return');
    const invoice = await prisma.wholesaleInvoice.findUnique({
      where: { id: input.invoiceId },
      include: { items: true },
    });
    if (!invoice) throw new NotFoundError('Invoice not found');
    if (invoice.status === 'VOIDED') throw new ValidationError('Invoice is voided');

    const itemMap = new Map(invoice.items.map((i) => [i.id, i]));
    for (const r of input.items) {
      const orig = itemMap.get(r.invoiceItemId);
      if (!orig) throw new ValidationError('Line not in this invoice');
      const remaining = orig.quantity.minus(orig.returnedQty);
      if (D(r.quantity).gt(remaining)) {
        throw new ValidationError(
          `Cannot return ${r.quantity} — only ${remaining.toString()} remain on that line`,
        );
      }
    }

    return prisma.$transaction(async (tx) => {
      let refundAmount = ZERO;
      const returnItems: {
        invoiceItemId: string;
        productId: string;
        qty: Prisma.Decimal;
        unitPrice: Prisma.Decimal;
        lineTotal: Prisma.Decimal;
      }[] = [];

      for (const r of input.items) {
        const orig = itemMap.get(r.invoiceItemId)!;
        const qty = D(r.quantity);
        const perUnit = orig.lineTotal.div(orig.quantity);
        const lineRefund = perUnit.mul(qty);
        refundAmount = refundAmount.plus(lineRefund);
        returnItems.push({
          invoiceItemId: orig.id,
          productId: orig.productId,
          qty,
          unitPrice: orig.unitPrice,
          lineTotal: lineRefund,
        });
        await tx.wholesaleInvoiceItem.update({
          where: { id: orig.id },
          data: { returnedQty: orig.returnedQty.plus(qty) },
        });
      }

      const year = new Date().getFullYear();
      const count = await tx.wholesaleReturn.count({ where: { branchId: invoice.branchId } });
      const number = nextDocumentNumber('WSR', year, count, 6);

      const ret = await tx.wholesaleReturn.create({
        data: {
          number,
          branchId: invoice.branchId,
          warehouseId: invoice.warehouseId,
          invoiceId: invoice.id,
          refundAmount,
          refundToBalance: input.refundToBalance,
          refundMethod: input.refundMethod,
          reason: input.reason || null,
          createdById: actor.userId,
          items: {
            create: returnItems.map((ri) => ({
              invoiceItemId: ri.invoiceItemId,
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
              branchId: invoice.branchId,
              warehouseId: invoice.warehouseId,
              productId: ri.productId,
              direction: 'IN',
              quantity: ri.qty,
              costPerUnit: ZERO,
              refType: 'WHOLESALE_RETURN',
              refId: ret.id,
              createdById: actor.userId,
            },
          }),
        ),
      );

      // Customer ledger credit (reduces receivable)
      await tx.customerLedger.create({
        data: {
          branchId: invoice.branchId,
          customerId: invoice.customerId,
          entryType: 'RETURN',
          refType: 'WholesaleReturn',
          refId: ret.id,
          description: `Return against ${invoice.number}`,
          debit: ZERO,
          credit: refundAmount,
          createdById: actor.userId,
        },
      });

      // Update invoice totals — returns reduce grand/balance; paid stays the same.
      const newGrand = invoice.grandTotal.minus(refundAmount);
      const newBalance = newGrand.minus(invoice.paidTotal);
      const totalOrig = invoice.items.reduce((a, li) => a.plus(li.quantity), ZERO);
      const totalReturned = invoice.items.reduce((acc, li) => {
        const addl = returnItems.find((r) => r.invoiceItemId === li.id)?.qty ?? ZERO;
        return acc.plus(li.returnedQty.plus(addl));
      }, ZERO);

      let newStatus: typeof invoice.status;
      if (totalReturned.gte(totalOrig)) newStatus = 'RETURNED';
      else if (totalReturned.gt(ZERO)) newStatus = 'PARTIALLY_RETURNED';
      else newStatus = deriveStatus(newGrand, invoice.paidTotal, invoice.dueDate);

      await tx.wholesaleInvoice.update({
        where: { id: invoice.id },
        data: { grandTotal: newGrand, balanceDue: newBalance, status: newStatus },
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: invoice.branchId,
          module: 'wholesale',
          action: 'return',
          entityType: 'WholesaleReturn',
          entityId: ret.id,
          after: {
            number: ret.number,
            invoiceNumber: invoice.number,
            refundAmount: refundAmount.toString(),
            items: returnItems.length,
          },
        },
        tx,
      );

      return ret;
    });
  },

  async voidInvoice(session: AppSession | null, input: VoidInvoiceInput) {
    const actor = await authorize(session, 'wholesale:void');
    const invoice = await prisma.wholesaleInvoice.findUnique({
      where: { id: input.invoiceId },
      include: { items: true, payments: true, returns: true },
    });
    if (!invoice) throw new NotFoundError('Invoice not found');
    if (invoice.status === 'VOIDED') throw new ValidationError('Already voided');
    if (invoice.payments.length > 0) {
      throw new ValidationError('Cannot void an invoice with payments — issue a return instead');
    }
    if (invoice.returns.length > 0) {
      throw new ValidationError('Cannot void an invoice with returns');
    }

    return prisma.$transaction(async (tx) => {
      // Reverse stock
      await Promise.all(
        invoice.items.map((li) =>
          tx.inventoryLedger.create({
            data: {
              branchId: invoice.branchId,
              warehouseId: invoice.warehouseId,
              productId: li.productId,
              direction: 'IN',
              quantity: li.quantity,
              costPerUnit: ZERO,
              refType: 'WHOLESALE_VOID',
              refId: invoice.id,
              createdById: actor.userId,
            },
          }),
        ),
      );
      // Reverse customer ledger
      await tx.customerLedger.create({
        data: {
          branchId: invoice.branchId,
          customerId: invoice.customerId,
          entryType: 'ADJUSTMENT',
          refType: 'WholesaleInvoice',
          refId: invoice.id,
          description: `Void ${invoice.number}: ${input.reason}`,
          debit: ZERO,
          credit: invoice.grandTotal,
          createdById: actor.userId,
        },
      });

      await tx.wholesaleInvoice.update({
        where: { id: invoice.id },
        data: { status: 'VOIDED', balanceDue: ZERO },
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: invoice.branchId,
          module: 'wholesale',
          action: 'void',
          entityType: 'WholesaleInvoice',
          entityId: invoice.id,
          before: { status: invoice.status },
          after: { status: 'VOIDED', reason: input.reason },
        },
        tx,
      );

      return invoice.id;
    });
  },

  async dashboardStats(session: AppSession | null, branchId?: string) {
    await authorize(session, 'wholesale:read');
    const [totals, overdue, recent] = await Promise.all([
      prisma.wholesaleInvoice.aggregate({
        where: { branchId, status: { notIn: ['VOIDED'] } },
        _sum: { grandTotal: true, paidTotal: true, balanceDue: true },
        _count: true,
      }),
      prisma.wholesaleInvoice.count({
        where: {
          branchId,
          dueDate: { lt: new Date() },
          balanceDue: { gt: 0 },
          status: { notIn: ['VOIDED', 'PAID'] },
        },
      }),
      prisma.wholesaleInvoice.findMany({
        where: { branchId },
        orderBy: { invoiceDate: 'desc' },
        take: 5,
        include: { customer: { select: { name: true, code: true } } },
      }),
    ]);
    return { totals, overdue, recent };
  },

  async searchProducts(session: AppSession | null, query: string, limit = 30) {
    await authorize(session, 'wholesale:write');
    const q = query.trim();
    const where = q
      ? {
          isActive: true,
          OR: [
            { sku: { equals: q, mode: 'insensitive' as const } },
            { barcode: { equals: q } },
            { name: { contains: q, mode: 'insensitive' as const } },
            { sku: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : { isActive: true };
    return prisma.product.findMany({
      where,
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
