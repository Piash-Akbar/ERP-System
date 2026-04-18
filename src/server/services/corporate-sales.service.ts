import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { authorize } from '@/server/auth/authorize';
import { recordAudit } from '@/server/audit/logger';
import type { AppSession } from '@/server/auth/session';
import { NotFoundError, ValidationError, ForbiddenError } from '@/lib/errors';
import { nextDocumentNumber } from '@/lib/document-number';
import {
  CORP_DISCOUNT_APPROVAL_THRESHOLD,
  type CreateQuoteInput,
  type UpdateQuoteStatusInput,
  type ConvertQuoteInput,
  type CreateOrderInput,
  type CancelOrderInput,
  type RecordDeliveryInput,
  type CreateInvoiceInput,
  type RecordInvoicePaymentInput,
} from '@/server/validators/corporate-sales';

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

function sumComputed<T extends { quantity: number; unitPrice: number; discountRate: number; taxRate: number }>(items: T[]) {
  let subtotal = ZERO;
  let discountTotal = ZERO;
  let taxTotal = ZERO;
  let grandTotal = ZERO;
  const computed = items.map((it) => {
    const c = computeLine(it);
    subtotal = subtotal.plus(c.gross);
    discountTotal = discountTotal.plus(c.discount);
    taxTotal = taxTotal.plus(c.tax);
    grandTotal = grandTotal.plus(c.lineTotal);
    return { ...it, ...c };
  });
  return { computed, subtotal, discountTotal, taxTotal, grandTotal };
}

function enforceDiscount(items: { discountRate: number }[], actor: AppSession) {
  if (actor.permissions.includes('corporate-sales:discount-override')) return;
  for (const it of items) {
    if (it.discountRate > CORP_DISCOUNT_APPROVAL_THRESHOLD) {
      throw new ForbiddenError(
        `Discount ${it.discountRate}% exceeds ${CORP_DISCOUNT_APPROVAL_THRESHOLD}% — requires approval`,
      );
    }
  }
}

function deriveInvoiceStatus(grand: Prisma.Decimal, paid: Prisma.Decimal, dueDate: Date | null) {
  if (paid.gte(grand) && grand.gt(ZERO)) return 'PAID' as const;
  if (paid.gt(ZERO)) return 'PARTIALLY_PAID' as const;
  if (dueDate && dueDate.getTime() < Date.now()) return 'OVERDUE' as const;
  return 'ISSUED' as const;
}

export const corporateService = {
  // ─── Quotes ──────────────────────────────────────────────────────────────
  async listQuotes(
    session: AppSession | null,
    filters: { status?: string; search?: string; branchId?: string; limit?: number } = {},
  ) {
    await authorize(session, 'corporate-sales:read');
    return prisma.corporateQuote.findMany({
      where: {
        branchId: filters.branchId,
        status: filters.status as
          | 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED'
          | undefined,
        OR: filters.search
          ? [
              { number: { contains: filters.search, mode: 'insensitive' } },
              { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
            ]
          : undefined,
      },
      orderBy: { quoteDate: 'desc' },
      take: filters.limit ?? 100,
      include: {
        customer: { select: { id: true, code: true, name: true } },
        _count: { select: { items: true } },
      },
    });
  },

  async getQuote(session: AppSession | null, id: string) {
    await authorize(session, 'corporate-sales:read');
    const quote = await prisma.corporateQuote.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { sku: true, name: true, unit: true } } } },
        customer: { select: { id: true, code: true, name: true, currency: true } },
        orders: { select: { id: true, number: true, status: true } },
      },
    });
    if (!quote) throw new NotFoundError('Quote not found');
    return quote;
  },

  async createQuote(session: AppSession | null, input: CreateQuoteInput) {
    const actor = await authorize(session, 'corporate-sales:quote');
    enforceDiscount(input.items, actor);

    const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
    if (!customer) throw new NotFoundError('Customer not found');
    if (customer.branchId !== input.branchId) {
      throw new ValidationError('Customer does not belong to this branch');
    }

    const { computed, subtotal, discountTotal, taxTotal, grandTotal } = sumComputed(input.items);

    return prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const count = await tx.corporateQuote.count({ where: { branchId: input.branchId } });
      const number = nextDocumentNumber('CSQ', year, count, 6);

      const quote = await tx.corporateQuote.create({
        data: {
          number,
          branchId: input.branchId,
          customerId: customer.id,
          salesRepId: actor.userId,
          validUntil: input.validUntil ?? null,
          currency: customer.currency,
          subtotal,
          discountTotal,
          taxTotal,
          grandTotal,
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
        },
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: input.branchId,
          module: 'corporate-sales',
          action: 'create-quote',
          entityType: 'CorporateQuote',
          entityId: quote.id,
          after: { number: quote.number, grandTotal: grandTotal.toString() },
        },
        tx,
      );
      return quote;
    });
  },

  async updateQuoteStatus(session: AppSession | null, input: UpdateQuoteStatusInput) {
    const actor = await authorize(session, 'corporate-sales:quote');
    const quote = await prisma.corporateQuote.findUnique({ where: { id: input.quoteId } });
    if (!quote) throw new NotFoundError('Quote not found');
    if (quote.status === 'CONVERTED') throw new ValidationError('Quote already converted');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.corporateQuote.update({
        where: { id: quote.id },
        data: {
          status: input.status,
          rejectReason: input.status === 'REJECTED' ? input.rejectReason || null : null,
        },
      });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: quote.branchId,
          module: 'corporate-sales',
          action: `quote-${input.status.toLowerCase()}`,
          entityType: 'CorporateQuote',
          entityId: quote.id,
          before: { status: quote.status },
          after: { status: input.status },
        },
        tx,
      );
      return updated;
    });
  },

  async convertQuoteToOrder(session: AppSession | null, input: ConvertQuoteInput) {
    const actor = await authorize(session, 'corporate-sales:order');
    const quote = await prisma.corporateQuote.findUnique({
      where: { id: input.quoteId },
      include: { items: true },
    });
    if (!quote) throw new NotFoundError('Quote not found');
    if (quote.status !== 'ACCEPTED' && quote.status !== 'SENT' && quote.status !== 'DRAFT') {
      throw new ValidationError(`Cannot convert a ${quote.status.toLowerCase()} quote`);
    }

    const warehouse = await prisma.warehouse.findUnique({ where: { id: input.warehouseId } });
    if (!warehouse || warehouse.branchId !== quote.branchId) {
      throw new ValidationError('Warehouse does not belong to this branch');
    }

    return prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const count = await tx.corporateOrder.count({ where: { branchId: quote.branchId } });
      const number = nextDocumentNumber('CSO', year, count, 6);

      const order = await tx.corporateOrder.create({
        data: {
          number,
          branchId: quote.branchId,
          warehouseId: input.warehouseId,
          customerId: quote.customerId,
          quoteId: quote.id,
          salesRepId: quote.salesRepId,
          paymentTerms: input.paymentTerms,
          expectedDate: input.expectedDate ?? null,
          currency: quote.currency,
          subtotal: quote.subtotal,
          discountTotal: quote.discountTotal,
          taxTotal: quote.taxTotal,
          grandTotal: quote.grandTotal,
          status: 'CONFIRMED',
          notes: quote.notes,
          createdById: actor.userId,
          items: {
            create: quote.items.map((i) => ({
              productId: i.productId,
              description: i.description,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              discountRate: i.discountRate,
              taxRate: i.taxRate,
              lineTotal: i.lineTotal,
            })),
          },
        },
      });
      await tx.corporateQuote.update({
        where: { id: quote.id },
        data: { status: 'CONVERTED' },
      });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: quote.branchId,
          module: 'corporate-sales',
          action: 'convert-quote',
          entityType: 'CorporateOrder',
          entityId: order.id,
          after: { orderNumber: order.number, quoteNumber: quote.number },
        },
        tx,
      );
      return order;
    });
  },

  // ─── Orders ──────────────────────────────────────────────────────────────
  async listOrders(
    session: AppSession | null,
    filters: { status?: string; search?: string; branchId?: string; limit?: number } = {},
  ) {
    await authorize(session, 'corporate-sales:read');
    return prisma.corporateOrder.findMany({
      where: {
        branchId: filters.branchId,
        status: filters.status as
          | 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_DELIVERED' | 'DELIVERED' | 'INVOICED' | 'CLOSED' | 'CANCELED'
          | undefined,
        OR: filters.search
          ? [
              { number: { contains: filters.search, mode: 'insensitive' } },
              { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
            ]
          : undefined,
      },
      orderBy: { orderDate: 'desc' },
      take: filters.limit ?? 100,
      include: {
        customer: { select: { id: true, code: true, name: true } },
        warehouse: { select: { name: true, code: true } },
        _count: { select: { items: true, deliveries: true, invoices: true } },
      },
    });
  },

  async getOrder(session: AppSession | null, id: string) {
    await authorize(session, 'corporate-sales:read');
    const order = await prisma.corporateOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { sku: true, name: true, unit: true } } } },
        customer: { select: { id: true, code: true, name: true, currency: true, creditLimit: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        quote: { select: { id: true, number: true } },
        deliveries: {
          include: { items: true },
          orderBy: { deliveryDate: 'desc' },
        },
        invoices: {
          include: { _count: { select: { items: true, payments: true } } },
          orderBy: { invoiceDate: 'desc' },
        },
      },
    });
    if (!order) throw new NotFoundError('Order not found');
    return order;
  },

  async createOrder(session: AppSession | null, input: CreateOrderInput) {
    const actor = await authorize(session, 'corporate-sales:order');
    enforceDiscount(input.items, actor);

    const [warehouse, customer] = await Promise.all([
      prisma.warehouse.findUnique({ where: { id: input.warehouseId } }),
      prisma.customer.findUnique({ where: { id: input.customerId } }),
    ]);
    if (!warehouse || warehouse.branchId !== input.branchId) {
      throw new ValidationError('Warehouse does not belong to this branch');
    }
    if (!customer) throw new NotFoundError('Customer not found');
    if (customer.branchId !== input.branchId) {
      throw new ValidationError('Customer does not belong to this branch');
    }
    if (customer.status !== 'ACTIVE') throw new ValidationError('Customer is not active');

    const { computed, subtotal, discountTotal, taxTotal, grandTotal } = sumComputed(input.items);

    return prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const count = await tx.corporateOrder.count({ where: { branchId: input.branchId } });
      const number = nextDocumentNumber('CSO', year, count, 6);

      const order = await tx.corporateOrder.create({
        data: {
          number,
          branchId: input.branchId,
          warehouseId: input.warehouseId,
          customerId: customer.id,
          salesRepId: actor.userId,
          paymentTerms: input.paymentTerms,
          expectedDate: input.expectedDate ?? null,
          currency: customer.currency,
          subtotal,
          discountTotal,
          taxTotal,
          grandTotal,
          status: 'CONFIRMED',
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
        },
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: input.branchId,
          module: 'corporate-sales',
          action: 'create-order',
          entityType: 'CorporateOrder',
          entityId: order.id,
          after: { number: order.number, grandTotal: grandTotal.toString() },
        },
        tx,
      );
      return order;
    });
  },

  async cancelOrder(session: AppSession | null, input: CancelOrderInput) {
    const actor = await authorize(session, 'corporate-sales:cancel');
    const order = await prisma.corporateOrder.findUnique({
      where: { id: input.orderId },
      include: { deliveries: true, invoices: true },
    });
    if (!order) throw new NotFoundError('Order not found');
    if (order.status === 'CANCELED') throw new ValidationError('Already canceled');
    if (order.deliveries.length > 0 || order.invoices.length > 0) {
      throw new ValidationError('Cannot cancel an order with deliveries or invoices');
    }

    return prisma.$transaction(async (tx) => {
      await tx.corporateOrder.update({
        where: { id: order.id },
        data: { status: 'CANCELED', cancelReason: input.reason },
      });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: order.branchId,
          module: 'corporate-sales',
          action: 'cancel-order',
          entityType: 'CorporateOrder',
          entityId: order.id,
          before: { status: order.status },
          after: { status: 'CANCELED', reason: input.reason },
        },
        tx,
      );
      return order.id;
    });
  },

  // ─── Deliveries ─────────────────────────────────────────────────────────
  async recordDelivery(session: AppSession | null, input: RecordDeliveryInput) {
    const actor = await authorize(session, 'corporate-sales:deliver');
    const order = await prisma.corporateOrder.findUnique({
      where: { id: input.orderId },
      include: { items: true, branch: { select: { allowNegativeStock: true } } },
    });
    if (!order) throw new NotFoundError('Order not found');
    if (order.status === 'CANCELED') throw new ValidationError('Order is canceled');

    const warehouse = await prisma.warehouse.findUnique({ where: { id: input.warehouseId } });
    if (!warehouse || warehouse.branchId !== order.branchId) {
      throw new ValidationError('Warehouse does not belong to this branch');
    }

    const itemMap = new Map(order.items.map((i) => [i.id, i]));
    for (const d of input.items) {
      const orig = itemMap.get(d.orderItemId);
      if (!orig) throw new ValidationError('Line not in this order');
      const remaining = orig.quantity.minus(orig.deliveredQty);
      if (D(d.quantity).gt(remaining)) {
        throw new ValidationError(
          `Line ${orig.productId}: cannot deliver ${d.quantity}, only ${remaining.toString()} remain`,
        );
      }
    }

    return prisma.$transaction(async (tx) => {
      // Negative-stock guard
      if (!order.branch.allowNegativeStock) {
        const productIds = Array.from(
          new Set(
            input.items
              .map((d) => itemMap.get(d.orderItemId)!.productId)
              .filter((v): v is string => !!v),
          ),
        );
        const balances = await tx.$queryRaw<
          { productId: string; balance: string }[]
        >`SELECT "productId",
                  SUM(CASE WHEN direction = 'IN' THEN quantity ELSE -quantity END)::text AS balance
             FROM "InventoryLedger"
            WHERE "branchId" = ${order.branchId}
              AND "warehouseId" = ${input.warehouseId}
              AND "productId" = ANY(${productIds}::text[])
            GROUP BY "productId"`;
        const balMap = new Map(balances.map((b) => [b.productId, D(b.balance)]));
        // Aggregate needed per product across all lines in this delivery
        const needed = new Map<string, Prisma.Decimal>();
        for (const d of input.items) {
          const orig = itemMap.get(d.orderItemId)!;
          needed.set(orig.productId, (needed.get(orig.productId) ?? ZERO).plus(D(d.quantity)));
        }
        for (const [pid, qty] of needed) {
          const bal = balMap.get(pid) ?? ZERO;
          if (bal.lt(qty)) {
            const p = await tx.product.findUnique({
              where: { id: pid },
              select: { sku: true },
            });
            throw new ValidationError(
              `Insufficient stock for ${p?.sku ?? pid}: have ${bal.toString()}, need ${qty.toString()}`,
            );
          }
        }
      }

      const year = new Date().getFullYear();
      const count = await tx.corporateDelivery.count({ where: { branchId: order.branchId } });
      const number = nextDocumentNumber('CSD', year, count, 6);

      const delivery = await tx.corporateDelivery.create({
        data: {
          number,
          branchId: order.branchId,
          warehouseId: input.warehouseId,
          orderId: order.id,
          trackingNo: input.trackingNo || null,
          carrier: input.carrier || null,
          notes: input.notes || null,
          createdById: actor.userId,
          items: {
            create: input.items.map((d) => {
              const orig = itemMap.get(d.orderItemId)!;
              return {
                orderItemId: orig.id,
                productId: orig.productId,
                quantity: D(d.quantity),
              };
            }),
          },
        },
        include: { items: true },
      });

      // Update delivered qty on order items and create stock OUT
      for (const d of input.items) {
        const orig = itemMap.get(d.orderItemId)!;
        await tx.corporateOrderItem.update({
          where: { id: orig.id },
          data: { deliveredQty: orig.deliveredQty.plus(D(d.quantity)) },
        });
        await tx.inventoryLedger.create({
          data: {
            branchId: order.branchId,
            warehouseId: input.warehouseId,
            productId: orig.productId,
            direction: 'OUT',
            quantity: D(d.quantity),
            costPerUnit: ZERO,
            refType: 'CORP_DELIVERY',
            refId: delivery.id,
            createdById: actor.userId,
          },
        });
      }

      // Recompute order status
      const updated = await tx.corporateOrderItem.findMany({ where: { orderId: order.id } });
      const allDelivered = updated.every((i) => i.deliveredQty.gte(i.quantity));
      const anyDelivered = updated.some((i) => i.deliveredQty.gt(ZERO));
      const newStatus = allDelivered
        ? order.status === 'INVOICED' || order.status === 'CLOSED'
          ? order.status
          : 'DELIVERED'
        : anyDelivered
          ? 'PARTIALLY_DELIVERED'
          : order.status;
      if (newStatus !== order.status) {
        await tx.corporateOrder.update({
          where: { id: order.id },
          data: { status: newStatus },
        });
      }

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: order.branchId,
          module: 'corporate-sales',
          action: 'deliver',
          entityType: 'CorporateDelivery',
          entityId: delivery.id,
          after: {
            number: delivery.number,
            orderNumber: order.number,
            items: delivery.items.length,
          },
        },
        tx,
      );
      return delivery;
    });
  },

  // ─── Invoices ────────────────────────────────────────────────────────────
  async createInvoice(session: AppSession | null, input: CreateInvoiceInput) {
    const actor = await authorize(session, 'corporate-sales:invoice');
    const order = await prisma.corporateOrder.findUnique({
      where: { id: input.orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundError('Order not found');
    if (order.status === 'CANCELED') throw new ValidationError('Order is canceled');

    const itemMap = new Map(order.items.map((i) => [i.id, i]));
    for (const it of input.items) {
      const orig = itemMap.get(it.orderItemId);
      if (!orig) throw new ValidationError('Line not in this order');
      const billable = orig.deliveredQty.minus(orig.invoicedQty);
      if (D(it.quantity).gt(billable)) {
        throw new ValidationError(
          `Cannot invoice ${it.quantity} — only ${billable.toString()} delivered+uninvoiced`,
        );
      }
    }

    return prisma.$transaction(async (tx) => {
      let subtotal = ZERO;
      let discountTotal = ZERO;
      let taxTotal = ZERO;
      let grandTotal = ZERO;
      const lineRows: {
        orderItemId: string;
        productId: string;
        description: string | null;
        quantity: Prisma.Decimal;
        unitPrice: Prisma.Decimal;
        discountRate: Prisma.Decimal;
        taxRate: Prisma.Decimal;
        lineTotal: Prisma.Decimal;
      }[] = [];

      for (const it of input.items) {
        const orig = itemMap.get(it.orderItemId)!;
        const qty = D(it.quantity);
        const gross = qty.mul(orig.unitPrice);
        const discount = gross.mul(orig.discountRate).div(100);
        const net = gross.minus(discount);
        const tax = net.mul(orig.taxRate).div(100);
        const lineTotal = net.plus(tax);

        subtotal = subtotal.plus(gross);
        discountTotal = discountTotal.plus(discount);
        taxTotal = taxTotal.plus(tax);
        grandTotal = grandTotal.plus(lineTotal);

        lineRows.push({
          orderItemId: orig.id,
          productId: orig.productId,
          description: orig.description,
          quantity: qty,
          unitPrice: orig.unitPrice,
          discountRate: orig.discountRate,
          taxRate: orig.taxRate,
          lineTotal,
        });

        await tx.corporateOrderItem.update({
          where: { id: orig.id },
          data: { invoicedQty: orig.invoicedQty.plus(qty) },
        });
      }

      const year = new Date().getFullYear();
      const count = await tx.corporateInvoice.count({ where: { branchId: order.branchId } });
      const number = nextDocumentNumber('CSI', year, count, 6);

      const invoice = await tx.corporateInvoice.create({
        data: {
          number,
          branchId: order.branchId,
          customerId: order.customerId,
          orderId: order.id,
          dueDate: input.dueDate ?? null,
          currency: order.currency,
          subtotal,
          discountTotal,
          taxTotal,
          grandTotal,
          paidTotal: ZERO,
          balanceDue: grandTotal,
          status: deriveInvoiceStatus(grandTotal, ZERO, input.dueDate ?? null),
          notes: input.notes || null,
          createdById: actor.userId,
          items: { create: lineRows },
        },
      });

      // Customer ledger debit
      await tx.customerLedger.create({
        data: {
          branchId: order.branchId,
          customerId: order.customerId,
          entryType: 'INVOICE',
          refType: 'CorporateInvoice',
          refId: invoice.id,
          description: `Corporate invoice ${invoice.number}`,
          debit: grandTotal,
          credit: ZERO,
          createdById: actor.userId,
        },
      });

      // Recompute order status if fully invoiced
      const refreshed = await tx.corporateOrderItem.findMany({ where: { orderId: order.id } });
      const allInvoiced = refreshed.every((i) => i.invoicedQty.gte(i.quantity));
      if (allInvoiced && order.status !== 'INVOICED' && order.status !== 'CLOSED') {
        await tx.corporateOrder.update({ where: { id: order.id }, data: { status: 'INVOICED' } });
      }

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: order.branchId,
          module: 'corporate-sales',
          action: 'create-invoice',
          entityType: 'CorporateInvoice',
          entityId: invoice.id,
          after: {
            number: invoice.number,
            orderNumber: order.number,
            grandTotal: grandTotal.toString(),
          },
        },
        tx,
      );
      return invoice;
    });
  },

  async getInvoice(session: AppSession | null, id: string) {
    await authorize(session, 'corporate-sales:read');
    const inv = await prisma.corporateInvoice.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { sku: true, name: true, unit: true } } } },
        payments: { orderBy: { paidAt: 'desc' } },
        customer: { select: { id: true, code: true, name: true, currency: true } },
        order: { select: { id: true, number: true, status: true } },
      },
    });
    if (!inv) throw new NotFoundError('Invoice not found');
    return inv;
  },

  async listInvoices(
    session: AppSession | null,
    filters: { status?: string; search?: string; branchId?: string; limit?: number } = {},
  ) {
    await authorize(session, 'corporate-sales:read');
    return prisma.corporateInvoice.findMany({
      where: {
        branchId: filters.branchId,
        status: filters.status as
          | 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'VOIDED'
          | undefined,
        OR: filters.search
          ? [
              { number: { contains: filters.search, mode: 'insensitive' } },
              { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
            ]
          : undefined,
      },
      orderBy: { invoiceDate: 'desc' },
      take: filters.limit ?? 100,
      include: {
        customer: { select: { code: true, name: true } },
        order: { select: { number: true } },
        _count: { select: { items: true, payments: true } },
      },
    });
  },

  async recordInvoicePayment(session: AppSession | null, input: RecordInvoicePaymentInput) {
    const actor = await authorize(session, 'corporate-sales:payment');
    const invoice = await prisma.corporateInvoice.findUnique({
      where: { id: input.invoiceId },
    });
    if (!invoice) throw new NotFoundError('Invoice not found');
    if (invoice.status === 'VOIDED') throw new ValidationError('Invoice is voided');
    const amount = D(input.amount);
    if (amount.gt(invoice.balanceDue)) {
      throw new ValidationError(
        `Payment ${amount.toString()} exceeds balance due ${invoice.balanceDue.toString()}`,
      );
    }

    return prisma.$transaction(async (tx) => {
      const payment = await tx.corporateInvoicePayment.create({
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
      const newStatus = deriveInvoiceStatus(invoice.grandTotal, newPaid, invoice.dueDate);

      await tx.corporateInvoice.update({
        where: { id: invoice.id },
        data: { paidTotal: newPaid, balanceDue: newBalance, status: newStatus },
      });

      await tx.customerLedger.create({
        data: {
          branchId: invoice.branchId,
          customerId: invoice.customerId,
          entryType: 'PAYMENT',
          refType: 'CorporateInvoice',
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
          module: 'corporate-sales',
          action: 'record-payment',
          entityType: 'CorporateInvoice',
          entityId: invoice.id,
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

  // ─── Dashboard ───────────────────────────────────────────────────────────
  async dashboardStats(session: AppSession | null, branchId?: string) {
    await authorize(session, 'corporate-sales:read');
    const [orderAgg, invoiceAgg, openQuotes, overdueInvoices] = await Promise.all([
      prisma.corporateOrder.aggregate({
        where: { branchId, status: { notIn: ['CANCELED'] } },
        _sum: { grandTotal: true },
        _count: true,
      }),
      prisma.corporateInvoice.aggregate({
        where: { branchId, status: { notIn: ['VOIDED'] } },
        _sum: { grandTotal: true, paidTotal: true, balanceDue: true },
        _count: true,
      }),
      prisma.corporateQuote.count({
        where: { branchId, status: { in: ['DRAFT', 'SENT'] } },
      }),
      prisma.corporateInvoice.count({
        where: {
          branchId,
          dueDate: { lt: new Date() },
          balanceDue: { gt: 0 },
          status: { notIn: ['VOIDED', 'PAID'] },
        },
      }),
    ]);
    return { orderAgg, invoiceAgg, openQuotes, overdueInvoices };
  },
};
