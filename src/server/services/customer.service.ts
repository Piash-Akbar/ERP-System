import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { authorize } from '@/server/auth/authorize';
import { recordAudit } from '@/server/audit/logger';
import type { AppSession } from '@/server/auth/session';
import type {
  CustomerCreateInput,
  CustomerUpdateInput,
  CustomerCategoryInput,
  CustomerInteractionInput,
} from '@/server/validators/crm';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { nextCustomerCode } from '@/lib/document-number';

const CUSTOMER_INCLUDE = {
  branch: { select: { id: true, name: true, code: true, currency: true } },
  category: { select: { id: true, name: true, discountPct: true } },
} as const;

type OutstandingRow = {
  customerId: string;
  totalDue: Prisma.Decimal;
  totalSales: Prisma.Decimal;
};

export const customerService = {
  async list(
    session: AppSession | null,
    filters: { branchId?: string; status?: string; type?: string; search?: string } = {},
  ) {
    await authorize(session, 'crm:read');
    const customers = await prisma.customer.findMany({
      where: {
        branchId: filters.branchId,
        status: filters.status as 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | undefined,
        type: filters.type as
          | 'RETAIL'
          | 'WHOLESALE'
          | 'CORPORATE'
          | 'ONLINE'
          | 'EXPORT'
          | undefined,
        OR: filters.search
          ? [
              { name: { contains: filters.search, mode: 'insensitive' } },
              { code: { contains: filters.search, mode: 'insensitive' } },
              { email: { contains: filters.search, mode: 'insensitive' } },
              { phone: { contains: filters.search, mode: 'insensitive' } },
              { contactPerson: { contains: filters.search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      orderBy: { code: 'asc' },
      include: CUSTOMER_INCLUDE,
    });

    const outstanding = await this.outstandingByCustomer();
    const dueMap = new Map(outstanding.map((o) => [o.customerId, o]));

    return customers.map((c) => {
      const agg = dueMap.get(c.id);
      return {
        ...c,
        totalSales: agg?.totalSales ?? new Prisma.Decimal(0),
        dueAmount: agg?.totalDue ?? new Prisma.Decimal(0),
      };
    });
  },

  async getById(session: AppSession | null, id: string) {
    await authorize(session, 'crm:read');
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        ...CUSTOMER_INCLUDE,
        interactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!customer) throw new NotFoundError('Customer not found');
    return customer;
  },

  async create(session: AppSession | null, input: CustomerCreateInput) {
    const actor = await authorize(session, 'crm:write');

    return prisma.$transaction(async (tx) => {
      const count = await tx.customer.count();
      const code = nextCustomerCode(count);
      const customer = await tx.customer.create({
        data: {
          branchId: input.branchId,
          code,
          name: input.name,
          type: input.type,
          categoryId: input.categoryId ? input.categoryId : null,
          contactPerson: input.contactPerson || null,
          phone: input.phone || null,
          email: input.email || null,
          address: input.address || null,
          city: input.city || null,
          country: input.country || null,
          taxId: input.taxId || null,
          creditLimit: new Prisma.Decimal(input.creditLimit),
          creditDays: input.creditDays,
          currency: input.currency,
          openingBalance: new Prisma.Decimal(input.openingBalance),
          status: input.status,
          notes: input.notes || null,
          createdById: actor.userId,
        },
      });

      if (new Prisma.Decimal(input.openingBalance).gt(0)) {
        await tx.customerLedger.create({
          data: {
            branchId: customer.branchId,
            customerId: customer.id,
            entryType: 'OPENING',
            refType: 'CUSTOMER',
            refId: customer.id,
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
          branchId: customer.branchId,
          module: 'crm',
          action: 'create',
          entityType: 'Customer',
          entityId: customer.id,
          after: {
            code: customer.code,
            name: customer.name,
            type: customer.type,
            status: customer.status,
          },
        },
        tx,
      );

      return customer;
    });
  },

  async update(session: AppSession | null, input: CustomerUpdateInput) {
    const actor = await authorize(session, 'crm:write');
    const existing = await prisma.customer.findUnique({ where: { id: input.id } });
    if (!existing) throw new NotFoundError('Customer not found');

    return prisma.$transaction(async (tx) => {
      const customer = await tx.customer.update({
        where: { id: input.id },
        data: {
          branchId: input.branchId,
          name: input.name,
          type: input.type,
          categoryId: input.categoryId ? input.categoryId : null,
          contactPerson: input.contactPerson || null,
          phone: input.phone || null,
          email: input.email || null,
          address: input.address || null,
          city: input.city || null,
          country: input.country || null,
          taxId: input.taxId || null,
          creditLimit: new Prisma.Decimal(input.creditLimit),
          creditDays: input.creditDays,
          currency: input.currency,
          status: input.status,
          notes: input.notes || null,
        },
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: customer.branchId,
          module: 'crm',
          action: 'update',
          entityType: 'Customer',
          entityId: customer.id,
          before: { name: existing.name, status: existing.status, type: existing.type },
          after: { name: customer.name, status: customer.status, type: customer.type },
        },
        tx,
      );

      return customer;
    });
  },

  async remove(session: AppSession | null, id: string) {
    const actor = await authorize(session, 'crm:delete');
    const existing = await prisma.customer.findUnique({
      where: { id },
      include: { _count: { select: { ledger: true, interactions: true } } },
    });
    if (!existing) throw new NotFoundError('Customer not found');
    if (existing._count.ledger > 0) {
      throw new ValidationError(
        'Customer has ledger activity — deactivate instead of deleting.',
      );
    }
    return prisma.$transaction(async (tx) => {
      await tx.customerInteraction.deleteMany({ where: { customerId: id } });
      await tx.customer.delete({ where: { id } });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: existing.branchId,
          module: 'crm',
          action: 'delete',
          entityType: 'Customer',
          entityId: id,
          before: { code: existing.code, name: existing.name },
        },
        tx,
      );
    });
  },

  async outstandingByCustomer(): Promise<OutstandingRow[]> {
    const rows = await prisma.$queryRaw<
      { customerId: string; totalDue: number; totalSales: number }[]
    >`SELECT "customerId",
             COALESCE(SUM(debit - credit), 0)::numeric AS "totalDue",
             COALESCE(SUM(debit), 0)::numeric AS "totalSales"
        FROM "CustomerLedger"
       GROUP BY "customerId"`;
    return rows.map((r) => ({
      customerId: r.customerId,
      totalDue: new Prisma.Decimal(r.totalDue ?? 0),
      totalSales: new Prisma.Decimal(r.totalSales ?? 0),
    }));
  },

  async getLedger(session: AppSession | null, customerId: string) {
    await authorize(session, 'crm:read');
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: CUSTOMER_INCLUDE,
    });
    if (!customer) throw new NotFoundError('Customer not found');
    const entries = await prisma.customerLedger.findMany({
      where: { customerId },
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
    return { customer, entries: enriched, totalDebit, totalCredit, currentBalance: running };
  },

  async listCategories(session: AppSession | null) {
    await authorize(session, 'crm:read');
    return prisma.customerCategory.findMany({ orderBy: { name: 'asc' } });
  },

  async createCategory(session: AppSession | null, input: CustomerCategoryInput) {
    const actor = await authorize(session, 'crm:write');
    const existing = await prisma.customerCategory.findUnique({ where: { name: input.name } });
    if (existing) throw new ValidationError('Category name already exists');
    const category = await prisma.customerCategory.create({
      data: {
        name: input.name,
        description: input.description || null,
        discountPct: new Prisma.Decimal(input.discountPct),
        isActive: input.isActive,
      },
    });
    await recordAudit({
      actorId: actor.userId,
      branchId: null,
      module: 'crm',
      action: 'category:create',
      entityType: 'CustomerCategory',
      entityId: category.id,
      after: { name: category.name },
    });
    return category;
  },

  async addInteraction(session: AppSession | null, input: CustomerInteractionInput) {
    const actor = await authorize(session, 'crm:write');
    const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
    if (!customer) throw new NotFoundError('Customer not found');
    const interaction = await prisma.customerInteraction.create({
      data: {
        customerId: input.customerId,
        type: input.type,
        subject: input.subject,
        body: input.body || null,
        followUpAt: input.followUpAt ?? null,
        createdById: actor.userId,
      },
    });
    await recordAudit({
      actorId: actor.userId,
      branchId: customer.branchId,
      module: 'crm',
      action: 'interaction',
      entityType: 'CustomerInteraction',
      entityId: interaction.id,
      after: { type: interaction.type, subject: interaction.subject },
    });
    return interaction;
  },
};
