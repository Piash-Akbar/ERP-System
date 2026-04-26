import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { authorize } from '@/server/auth/authorize';
import type { AppSession } from '@/server/auth/session';

const ZERO = new Prisma.Decimal(0);

export interface RangeFilter {
  branchId?: string;
  from?: Date;
  to?: Date;
}

export const reportsService = {
  /**
   * Sales summary — totals by channel (POS / Wholesale / Corporate) for a
   * date range, optionally scoped to a branch.
   */
  async salesSummary(session: AppSession | null, f: RangeFilter = {}) {
    await authorize(session, 'reports:read');
    const dateFilter = { gte: f.from, lte: f.to };

    const [posAgg, wholesaleAgg, corporateAgg] = await Promise.all([
      prisma.posSale.aggregate({
        where: {
          branchId: f.branchId,
          saleDate: dateFilter,
          status: { not: 'VOIDED' },
        },
        _sum: { grandTotal: true, discountTotal: true, taxTotal: true, paidTotal: true },
        _count: { _all: true },
      }),
      prisma.wholesaleInvoice.aggregate({
        where: {
          branchId: f.branchId,
          invoiceDate: dateFilter,
          status: { notIn: ['VOIDED'] },
        },
        _sum: { grandTotal: true, discountTotal: true, taxTotal: true, paidTotal: true, balanceDue: true },
        _count: { _all: true },
      }),
      prisma.corporateInvoice.aggregate({
        where: {
          branchId: f.branchId,
          invoiceDate: dateFilter,
        },
        _sum: { grandTotal: true, discountTotal: true, taxTotal: true, paidTotal: true, balanceDue: true },
        _count: { _all: true },
      }),
    ]);

    const channels = [
      {
        key: 'pos',
        label: 'POS / Retail',
        count: posAgg._count._all,
        gross: posAgg._sum.grandTotal ?? ZERO,
        discount: posAgg._sum.discountTotal ?? ZERO,
        tax: posAgg._sum.taxTotal ?? ZERO,
        paid: posAgg._sum.paidTotal ?? ZERO,
        outstanding: ZERO,
      },
      {
        key: 'wholesale',
        label: 'Wholesale',
        count: wholesaleAgg._count._all,
        gross: wholesaleAgg._sum.grandTotal ?? ZERO,
        discount: wholesaleAgg._sum.discountTotal ?? ZERO,
        tax: wholesaleAgg._sum.taxTotal ?? ZERO,
        paid: wholesaleAgg._sum.paidTotal ?? ZERO,
        outstanding: wholesaleAgg._sum.balanceDue ?? ZERO,
      },
      {
        key: 'corporate',
        label: 'Corporate',
        count: corporateAgg._count._all,
        gross: corporateAgg._sum.grandTotal ?? ZERO,
        discount: corporateAgg._sum.discountTotal ?? ZERO,
        tax: corporateAgg._sum.taxTotal ?? ZERO,
        paid: corporateAgg._sum.paidTotal ?? ZERO,
        outstanding: corporateAgg._sum.balanceDue ?? ZERO,
      },
    ];

    const totals = channels.reduce(
      (acc, c) => ({
        count: acc.count + c.count,
        gross: acc.gross.plus(c.gross),
        discount: acc.discount.plus(c.discount),
        tax: acc.tax.plus(c.tax),
        paid: acc.paid.plus(c.paid),
        outstanding: acc.outstanding.plus(c.outstanding),
      }),
      { count: 0, gross: ZERO, discount: ZERO, tax: ZERO, paid: ZERO, outstanding: ZERO },
    );

    return { channels, totals };
  },

  /**
   * Top products by quantity sold across POS + Wholesale + Corporate in the
   * range.
   */
  async topProducts(session: AppSession | null, f: RangeFilter & { limit?: number } = {}) {
    await authorize(session, 'reports:read');
    const limit = f.limit ?? 20;
    const dateFilter = { gte: f.from, lte: f.to };

    const [pos, ws, corp] = await Promise.all([
      prisma.posSaleItem.groupBy({
        by: ['productId'],
        where: {
          sale: { branchId: f.branchId, saleDate: dateFilter, status: { not: 'VOIDED' } },
        },
        _sum: { quantity: true, lineTotal: true },
      }),
      prisma.wholesaleInvoiceItem.groupBy({
        by: ['productId'],
        where: {
          invoice: { branchId: f.branchId, invoiceDate: dateFilter, status: { notIn: ['VOIDED'] } },
        },
        _sum: { quantity: true, lineTotal: true },
      }),
      prisma.corporateInvoiceItem.groupBy({
        by: ['productId'],
        where: { invoice: { branchId: f.branchId, invoiceDate: dateFilter } },
        _sum: { quantity: true, lineTotal: true },
      }),
    ]);

    const map = new Map<string, { productId: string; qty: Prisma.Decimal; revenue: Prisma.Decimal }>();
    for (const rows of [pos, ws, corp]) {
      for (const r of rows) {
        const prev = map.get(r.productId) ?? { productId: r.productId, qty: ZERO, revenue: ZERO };
        prev.qty = prev.qty.plus(r._sum.quantity ?? ZERO);
        prev.revenue = prev.revenue.plus(r._sum.lineTotal ?? ZERO);
        map.set(r.productId, prev);
      }
    }

    const rows = [...map.values()].sort((a, b) => b.qty.cmp(a.qty)).slice(0, limit);
    const products = await prisma.product.findMany({
      where: { id: { in: rows.map((r) => r.productId) } },
      select: { id: true, sku: true, name: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    return rows.map((r) => ({
      productId: r.productId,
      sku: byId.get(r.productId)?.sku ?? '—',
      name: byId.get(r.productId)?.name ?? '—',
      qty: r.qty,
      revenue: r.revenue,
    }));
  },

  /**
   * Purchase summary — counts, totals, and outstanding payables per branch
   * for the date range.
   */
  async purchaseSummary(session: AppSession | null, f: RangeFilter = {}) {
    await authorize(session, 'reports:read');
    const dateFilter = { gte: f.from, lte: f.to };

    const [poAgg, invAgg, unpaid] = await Promise.all([
      prisma.purchaseOrder.aggregate({
        where: { branchId: f.branchId, orderDate: dateFilter },
        _sum: { grandTotal: true },
        _count: { _all: true },
      }),
      prisma.purchaseInvoice.aggregate({
        where: { branchId: f.branchId, invoiceDate: dateFilter },
        _sum: { grandTotal: true, paidAmount: true },
        _count: { _all: true },
      }),
      prisma.purchaseInvoice.aggregate({
        where: { branchId: f.branchId, status: { notIn: ['PAID', 'CANCELLED'] } },
        _sum: { grandTotal: true, paidAmount: true },
      }),
    ]);

    const invoiceTotal = invAgg._sum.grandTotal ?? ZERO;
    const invoicePaid = invAgg._sum.paidAmount ?? ZERO;
    const openTotal = unpaid._sum.grandTotal ?? ZERO;
    const openPaid = unpaid._sum.paidAmount ?? ZERO;

    return {
      poCount: poAgg._count._all,
      poTotal: poAgg._sum.grandTotal ?? ZERO,
      invoiceCount: invAgg._count._all,
      invoiceTotal,
      invoicePaid,
      invoiceOutstanding: invoiceTotal.minus(invoicePaid),
      openPayable: openTotal.minus(openPaid),
    };
  },

  /**
   * Inventory valuation — per-product on-hand qty & value derived from the
   * ledger. Uses weighted-average cost snapshot from latest ledger rows
   * (simplified: last known costPerUnit per product).
   */
  async inventoryValuation(session: AppSession | null, f: { branchId?: string } = {}) {
    await authorize(session, 'reports:read');

    const branchFilter = f.branchId ? Prisma.sql`AND "branchId" = ${f.branchId}` : Prisma.empty;
    const grouped = await prisma.$queryRaw<
      { productId: string; balance: string }[]
    >`SELECT "productId",
             SUM(CASE WHEN direction = 'IN' THEN quantity ELSE -quantity END)::text AS balance
        FROM "InventoryLedger"
       WHERE 1=1 ${branchFilter}
       GROUP BY "productId"`;

    const productIds = grouped.map((g) => g.productId);
    if (productIds.length === 0) return { rows: [], totals: { qty: ZERO, value: ZERO } };

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, sku: true, name: true, unit: true, costPrice: true, reorderLevel: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const rows = grouped
      .map((g) => {
        const p = byId.get(g.productId);
        if (!p) return null;
        const qty = new Prisma.Decimal(g.balance ?? 0);
        const value = qty.mul(p.costPrice);
        return {
          productId: g.productId,
          sku: p.sku,
          name: p.name,
          unit: p.unit,
          qty,
          cost: p.costPrice,
          value,
          reorderLevel: p.reorderLevel,
          belowReorder: qty.lte(p.reorderLevel) && p.reorderLevel.gt(0),
        };
      })
      .filter(Boolean) as {
      productId: string;
      sku: string;
      name: string;
      unit: string;
      qty: Prisma.Decimal;
      cost: Prisma.Decimal;
      value: Prisma.Decimal;
      reorderLevel: Prisma.Decimal;
      belowReorder: boolean;
    }[];

    rows.sort((a, b) => b.value.cmp(a.value));
    const totals = rows.reduce(
      (acc, r) => ({ qty: acc.qty.plus(r.qty), value: acc.value.plus(r.value) }),
      { qty: ZERO, value: ZERO },
    );
    return { rows, totals };
  },

  /**
   * HR summary — employee counts and last payroll totals.
   */
  async hrSummary(session: AppSession | null, f: { branchId?: string } = {}) {
    await authorize(session, 'reports:read');

    const [active, onLeave, terminated, lastRun] = await Promise.all([
      prisma.employee.count({ where: { branchId: f.branchId, status: 'ACTIVE' } }),
      prisma.employee.count({ where: { branchId: f.branchId, status: 'ON_LEAVE' } }),
      prisma.employee.count({ where: { branchId: f.branchId, status: 'TERMINATED' } }),
      prisma.payrollRun.findFirst({
        where: { branchId: f.branchId, status: { in: ['APPROVED', 'PAID', 'LOCKED'] } },
        orderBy: { period: 'desc' },
        include: { branch: true },
      }),
    ]);

    return {
      headcount: { active, onLeave, terminated },
      lastPayroll: lastRun
        ? {
            id: lastRun.id,
            period: lastRun.period,
            branch: lastRun.branch.code,
            gross: lastRun.totalGross,
            deduction: lastRun.totalDeduction,
            net: lastRun.totalNet,
            status: lastRun.status,
          }
        : null,
    };
  },

  /**
   * Dashboard KPIs — compact snapshot for the admin dashboard and
   * reports hub.
   */
  async dashboardKpis(session: AppSession | null, f: RangeFilter = {}) {
    await authorize(session, 'reports:read');
    const [sales, purchase, inv, pendingApprovals, lowStock] = await Promise.all([
      this.salesSummary(session, f),
      this.purchaseSummary(session, f),
      this.inventoryValuation(session, { branchId: f.branchId }),
      prisma.approvalRequest.count({ where: { status: 'PENDING' } }),
      prisma.product.count({
        where: { isActive: true, reorderLevel: { gt: 0 } },
      }),
    ]);
    return {
      salesGross: sales.totals.gross,
      salesCount: sales.totals.count,
      salesOutstanding: sales.totals.outstanding,
      purchaseTotal: purchase.invoiceTotal,
      purchaseOutstanding: purchase.openPayable,
      inventoryValue: inv.totals.value,
      pendingApprovals,
      lowStockProducts: inv.rows.filter((r) => r.belowReorder).length,
      activeProducts: lowStock,
    };
  },

  /**
   * Cash-flow summary for a date range.
   * INCOME  = POS cash collected + Wholesale payments received + Corporate payments received
   * OUTCOME = Supplier payments made
   */
  async cashFlow(session: AppSession | null, f: RangeFilter = {}) {
    await authorize(session, 'reports:read');

    const [
      posAgg,
      wholesalePayAgg,
      corporatePayAgg,
      supplierPayAgg,
      posRows,
      wholesalePayRows,
      corporatePayRows,
      supplierPayRows,
    ] = await Promise.all([
      // ── Income aggregates ─────────────────────────────────────────────────
      prisma.posSale.aggregate({
        where: {
          branchId: f.branchId,
          saleDate: { gte: f.from, lte: f.to },
          status: { not: 'VOIDED' },
        },
        _sum: { paidTotal: true },
        _count: { _all: true },
      }),
      prisma.wholesalePayment.aggregate({
        where: {
          paidAt: { gte: f.from, lte: f.to },
          invoice: { branchId: f.branchId },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.corporateInvoicePayment.aggregate({
        where: {
          paidAt: { gte: f.from, lte: f.to },
          invoice: { branchId: f.branchId },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      // ── Outcome aggregates ────────────────────────────────────────────────
      prisma.supplierPayment.aggregate({
        where: {
          branchId: f.branchId,
          paymentDate: { gte: f.from, lte: f.to },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      // ── Income detail rows ─────────────────────────────────────────────────
      prisma.posSale.findMany({
        where: {
          branchId: f.branchId,
          saleDate: { gte: f.from, lte: f.to },
          status: { not: 'VOIDED' },
        },
        select: {
          id: true,
          number: true,
          saleDate: true,
          paidTotal: true,
          branch: { select: { code: true } },
        },
        orderBy: { saleDate: 'desc' },
        take: 500,
      }),
      prisma.wholesalePayment.findMany({
        where: {
          paidAt: { gte: f.from, lte: f.to },
          invoice: { branchId: f.branchId },
        },
        select: {
          id: true,
          amount: true,
          method: true,
          paidAt: true,
          reference: true,
          invoice: {
            select: {
              number: true,
              branch: { select: { code: true } },
              customer: { select: { name: true } },
            },
          },
        },
        orderBy: { paidAt: 'desc' },
        take: 500,
      }),
      prisma.corporateInvoicePayment.findMany({
        where: {
          paidAt: { gte: f.from, lte: f.to },
          invoice: { branchId: f.branchId },
        },
        select: {
          id: true,
          amount: true,
          method: true,
          paidAt: true,
          reference: true,
          invoice: {
            select: {
              number: true,
              branch: { select: { code: true } },
              customer: { select: { name: true } },
            },
          },
        },
        orderBy: { paidAt: 'desc' },
        take: 500,
      }),
      prisma.supplierPayment.findMany({
        where: {
          branchId: f.branchId,
          paymentDate: { gte: f.from, lte: f.to },
        },
        select: {
          id: true,
          number: true,
          amount: true,
          method: true,
          paymentDate: true,
          reference: true,
          supplier: { select: { name: true } },
          branch: { select: { code: true } },
        },
        orderBy: { paymentDate: 'desc' },
        take: 500,
      }),
    ]);

    const incomeSources = [
      {
        key: 'pos',
        label: 'POS / Retail',
        count: posAgg._count._all,
        amount: posAgg._sum.paidTotal ?? ZERO,
      },
      {
        key: 'wholesale',
        label: 'Wholesale payments',
        count: wholesalePayAgg._count._all,
        amount: wholesalePayAgg._sum.amount ?? ZERO,
      },
      {
        key: 'corporate',
        label: 'Corporate payments',
        count: corporatePayAgg._count._all,
        amount: corporatePayAgg._sum.amount ?? ZERO,
      },
    ];

    const outcomeSources = [
      {
        key: 'supplier',
        label: 'Supplier payments',
        count: supplierPayAgg._count._all,
        amount: supplierPayAgg._sum.amount ?? ZERO,
      },
    ];

    const totalIncome = incomeSources.reduce((s, r) => s.plus(r.amount), ZERO);
    const totalOutcome = outcomeSources.reduce((s, r) => s.plus(r.amount), ZERO);
    const net = totalIncome.minus(totalOutcome);

    // Unified transaction rows for detail table
    type CashRow = {
      id: string;
      date: Date;
      flow: 'IN' | 'OUT';
      source: string;
      ref: string;
      party: string;
      method: string;
      amount: Prisma.Decimal;
      branch: string;
    };

    const rows: CashRow[] = [
      ...posRows.map((r) => ({
        id: r.id,
        date: r.saleDate,
        flow: 'IN' as const,
        source: 'POS Sale',
        ref: r.number,
        party: 'Walk-in',
        method: 'Mixed',
        amount: r.paidTotal,
        branch: r.branch.code,
      })),
      ...wholesalePayRows.map((r) => ({
        id: r.id,
        date: r.paidAt,
        flow: 'IN' as const,
        source: 'Wholesale',
        ref: r.invoice.number,
        party: r.invoice.customer.name,
        method: r.method,
        amount: r.amount,
        branch: r.invoice.branch.code,
      })),
      ...corporatePayRows.map((r) => ({
        id: r.id,
        date: r.paidAt,
        flow: 'IN' as const,
        source: 'Corporate',
        ref: r.invoice.number,
        party: r.invoice.customer.name,
        method: r.method,
        amount: r.amount,
        branch: r.invoice.branch.code,
      })),
      ...supplierPayRows.map((r) => ({
        id: r.id,
        date: r.paymentDate,
        flow: 'OUT' as const,
        source: 'Supplier payment',
        ref: r.number,
        party: r.supplier.name,
        method: r.method,
        amount: r.amount,
        branch: r.branch.code,
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return { incomeSources, outcomeSources, totalIncome, totalOutcome, net, rows };
  },
};
