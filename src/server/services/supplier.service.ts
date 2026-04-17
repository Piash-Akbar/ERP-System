import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { authorize } from '@/server/auth/authorize';
import { recordAudit } from '@/server/audit/logger';
import type { AppSession } from '@/server/auth/session';
import type {
  SupplierCreateInput,
  SupplierUpdateInput,
  SupplierPaymentInput,
} from '@/server/validators/suppliers';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { nextSupplierCode, nextPaymentNumber } from '@/lib/document-number';

const SUPPLIER_INCLUDE = {
  branch: { select: { id: true, name: true, code: true, currency: true } },
} as const;

type OutstandingRow = { supplierId: string; totalDue: Prisma.Decimal; totalPurchase: Prisma.Decimal };

export const supplierService = {
  async list(
    session: AppSession | null,
    filters: { branchId?: string; status?: string; search?: string } = {},
  ) {
    await authorize(session, 'suppliers:read');
    const suppliers = await prisma.supplier.findMany({
      where: {
        branchId: filters.branchId,
        status: filters.status as 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | undefined,
        OR: filters.search
          ? [
              { name: { contains: filters.search, mode: 'insensitive' } },
              { code: { contains: filters.search, mode: 'insensitive' } },
              { email: { contains: filters.search, mode: 'insensitive' } },
              { contactPerson: { contains: filters.search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      orderBy: { code: 'asc' },
      include: SUPPLIER_INCLUDE,
    });

    const outstanding = await this.outstandingBySupplier();
    const dueMap = new Map(outstanding.map((o) => [o.supplierId, o]));

    return suppliers.map((s) => {
      const agg = dueMap.get(s.id);
      return {
        ...s,
        totalPurchase: agg?.totalPurchase ?? new Prisma.Decimal(0),
        dueAmount: agg?.totalDue ?? new Prisma.Decimal(0),
      };
    });
  },

  async getById(session: AppSession | null, id: string) {
    await authorize(session, 'suppliers:read');
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        ...SUPPLIER_INCLUDE,
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            number: true,
            status: true,
            orderDate: true,
            grandTotal: true,
          },
        },
        purchaseInvoices: {
          orderBy: { invoiceDate: 'desc' },
          take: 10,
          select: {
            id: true,
            number: true,
            status: true,
            invoiceDate: true,
            dueDate: true,
            grandTotal: true,
            paidAmount: true,
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 10,
          select: {
            id: true,
            number: true,
            method: true,
            paymentDate: true,
            amount: true,
            reference: true,
          },
        },
      },
    });
    if (!supplier) throw new NotFoundError('Supplier not found');
    return supplier;
  },

  async create(session: AppSession | null, input: SupplierCreateInput) {
    const actor = await authorize(session, 'suppliers:write');

    return prisma.$transaction(async (tx) => {
      const count = await tx.supplier.count();
      const code = nextSupplierCode(count);
      const supplier = await tx.supplier.create({
        data: {
          branchId: input.branchId,
          code,
          name: input.name,
          contactPerson: input.contactPerson || null,
          phone: input.phone || null,
          email: input.email || null,
          address: input.address || null,
          city: input.city || null,
          country: input.country || null,
          taxId: input.taxId || null,
          paymentTerms: input.paymentTerms,
          currency: input.currency,
          openingBalance: new Prisma.Decimal(input.openingBalance),
          status: input.status,
          notes: input.notes || null,
          createdById: actor.userId,
        },
      });

      if (new Prisma.Decimal(input.openingBalance).gt(0)) {
        await tx.supplierLedger.create({
          data: {
            branchId: supplier.branchId,
            supplierId: supplier.id,
            entryType: 'OPENING',
            refType: 'SUPPLIER',
            refId: supplier.id,
            description: 'Opening balance',
            debit: new Prisma.Decimal(input.openingBalance),
            credit: new Prisma.Decimal(0),
            createdById: actor.userId,
          },
        });
      }

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: supplier.branchId,
          module: 'suppliers',
          action: 'create',
          entityType: 'Supplier',
          entityId: supplier.id,
          after: { code: supplier.code, name: supplier.name, status: supplier.status },
        },
        tx,
      );

      return supplier;
    });
  },

  async update(session: AppSession | null, input: SupplierUpdateInput) {
    const actor = await authorize(session, 'suppliers:write');
    const existing = await prisma.supplier.findUnique({ where: { id: input.id } });
    if (!existing) throw new NotFoundError('Supplier not found');

    return prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.update({
        where: { id: input.id },
        data: {
          branchId: input.branchId,
          name: input.name,
          contactPerson: input.contactPerson || null,
          phone: input.phone || null,
          email: input.email || null,
          address: input.address || null,
          city: input.city || null,
          country: input.country || null,
          taxId: input.taxId || null,
          paymentTerms: input.paymentTerms,
          currency: input.currency,
          status: input.status,
          notes: input.notes || null,
        },
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: supplier.branchId,
          module: 'suppliers',
          action: 'update',
          entityType: 'Supplier',
          entityId: supplier.id,
          before: { name: existing.name, status: existing.status },
          after: { name: supplier.name, status: supplier.status },
        },
        tx,
      );

      return supplier;
    });
  },

  async remove(session: AppSession | null, id: string) {
    const actor = await authorize(session, 'suppliers:delete');
    const existing = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: { select: { purchaseOrders: true, purchaseInvoices: true, payments: true } },
      },
    });
    if (!existing) throw new NotFoundError('Supplier not found');
    if (
      existing._count.purchaseOrders > 0 ||
      existing._count.purchaseInvoices > 0 ||
      existing._count.payments > 0
    ) {
      throw new ValidationError(
        'Supplier has activity — deactivate instead of deleting.',
      );
    }
    return prisma.$transaction(async (tx) => {
      await tx.supplier.delete({ where: { id } });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: existing.branchId,
          module: 'suppliers',
          action: 'delete',
          entityType: 'Supplier',
          entityId: id,
          before: { code: existing.code, name: existing.name },
        },
        tx,
      );
    });
  },

  /**
   * Sum of debit - credit per supplier (running outstanding balance),
   * plus total purchases (debit entries).
   */
  async outstandingBySupplier(): Promise<OutstandingRow[]> {
    const rows = await prisma.$queryRaw<
      { supplierId: string; totalDue: number; totalPurchase: number }[]
    >`SELECT "supplierId",
             COALESCE(SUM(debit - credit), 0)::numeric AS "totalDue",
             COALESCE(SUM(debit), 0)::numeric AS "totalPurchase"
        FROM "SupplierLedger"
       GROUP BY "supplierId"`;
    return rows.map((r) => ({
      supplierId: r.supplierId,
      totalDue: new Prisma.Decimal(r.totalDue ?? 0),
      totalPurchase: new Prisma.Decimal(r.totalPurchase ?? 0),
    }));
  },

  async getLedger(session: AppSession | null, supplierId: string) {
    await authorize(session, 'suppliers:read');
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      include: SUPPLIER_INCLUDE,
    });
    if (!supplier) throw new NotFoundError('Supplier not found');
    const entries = await prisma.supplierLedger.findMany({
      where: { supplierId },
      orderBy: { createdAt: 'asc' },
    });
    let running = new Prisma.Decimal(0);
    const enriched = entries.map((e) => {
      running = running.plus(e.debit).minus(e.credit);
      return { ...e, runningBalance: running };
    });
    const totalDebit = entries.reduce(
      (acc, e) => acc.plus(e.debit),
      new Prisma.Decimal(0),
    );
    const totalCredit = entries.reduce(
      (acc, e) => acc.plus(e.credit),
      new Prisma.Decimal(0),
    );
    return { supplier, entries: enriched, totalDebit, totalCredit, currentBalance: running };
  },

  async recordPayment(session: AppSession | null, input: SupplierPaymentInput) {
    const actor = await authorize(session, 'purchase:pay');
    const supplier = await prisma.supplier.findUnique({ where: { id: input.supplierId } });
    if (!supplier) throw new NotFoundError('Supplier not found');

    const amount = new Prisma.Decimal(input.amount);

    return prisma.$transaction(async (tx) => {
      const count = await tx.supplierPayment.count();
      const number = nextPaymentNumber(count);

      const payment = await tx.supplierPayment.create({
        data: {
          branchId: supplier.branchId,
          number,
          supplierId: supplier.id,
          invoiceId: input.invoiceId ? input.invoiceId : null,
          method: input.method,
          paymentDate: input.paymentDate,
          amount,
          currency: supplier.currency,
          reference: input.reference || null,
          notes: input.notes || null,
          createdById: actor.userId,
        },
      });

      await tx.supplierLedger.create({
        data: {
          branchId: supplier.branchId,
          supplierId: supplier.id,
          entryType: 'PAYMENT',
          refType: 'PAYMENT',
          refId: payment.id,
          description: `Payment ${number}${input.reference ? ` — ${input.reference}` : ''}`,
          debit: new Prisma.Decimal(0),
          credit: amount,
          entryDate: input.paymentDate,
          createdById: actor.userId,
        },
      });

      if (input.invoiceId) {
        const invoice = await tx.purchaseInvoice.findUnique({
          where: { id: input.invoiceId },
        });
        if (!invoice) throw new NotFoundError('Invoice not found');
        const newPaid = invoice.paidAmount.plus(amount);
        const status =
          newPaid.gte(invoice.grandTotal)
            ? 'PAID'
            : newPaid.gt(0)
              ? 'PARTIALLY_PAID'
              : 'PENDING';
        await tx.purchaseInvoice.update({
          where: { id: invoice.id },
          data: { paidAmount: newPaid, status },
        });
      }

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: supplier.branchId,
          module: 'suppliers',
          action: 'payment',
          entityType: 'SupplierPayment',
          entityId: payment.id,
          after: {
            number,
            amount: amount.toString(),
            method: input.method,
            invoiceId: input.invoiceId || null,
          },
        },
        tx,
      );

      return payment;
    });
  },

  async listPayments(session: AppSession | null, limit = 20) {
    await authorize(session, 'suppliers:read');
    return prisma.supplierPayment.findMany({
      orderBy: { paymentDate: 'desc' },
      take: limit,
      include: {
        supplier: { select: { id: true, code: true, name: true } },
        invoice: { select: { id: true, number: true } },
      },
    });
  },
};
