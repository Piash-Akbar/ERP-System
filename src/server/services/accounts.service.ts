import 'server-only';
import { Prisma, type SystemAccountKey } from '@prisma/client';
import { prisma } from '@/server/db';
import { authorize } from '@/server/auth/authorize';
import { recordAudit } from '@/server/audit/logger';
import type { AppSession } from '@/server/auth/session';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { nextDocumentNumber } from '@/lib/document-number';
import type {
  JournalCreateInput,
  JournalLineInput,
  JournalVoidInput,
} from '@/server/validators/accounts';

const ZERO = new Prisma.Decimal(0);
const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

type Tx = Prisma.TransactionClient;

async function findOpenPeriod(tx: Tx, branchId: string, date: Date) {
  const period = await tx.period.findFirst({
    where: {
      branchId,
      startsAt: { lte: date },
      endsAt: { gte: date },
    },
  });
  if (!period) throw new ValidationError('No fiscal period covers this date for the branch');
  if (period.status !== 'OPEN') throw new ValidationError(`Period "${period.name}" is ${period.status}`);
  return period;
}

async function assertAccountsPostable(tx: Tx, lines: JournalLineInput[]) {
  const ids = Array.from(new Set(lines.map((l) => l.accountId)));
  const accounts = await tx.chartAccount.findMany({ where: { id: { in: ids } } });
  const byId = new Map(accounts.map((a) => [a.id, a]));
  for (const l of lines) {
    const acc = byId.get(l.accountId);
    if (!acc) throw new ValidationError(`Account ${l.accountId} not found`);
    if (!acc.isActive) throw new ValidationError(`Account ${acc.code} is inactive`);
    if (!acc.isPosting) throw new ValidationError(`Account ${acc.code} is a header — pick a posting account`);
  }
}

async function nextJournalNumber(tx: Tx, date: Date) {
  const year = date.getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  const count = await tx.journalEntry.count({
    where: { createdAt: { gte: start, lt: end } },
  });
  return nextDocumentNumber('JE', year, count, 4);
}

export type JournalPostInput = JournalCreateInput & {
  sourceModule?: string;
  sourceRefType?: string;
  sourceRefId?: string;
};

export const accountsService = {
  /**
   * Shared posting helper — callable both from the manual journal UI and
   * from other modules (POS, wholesale, purchase…) inside their own
   * transaction via the `tx` parameter.
   */
  async postJournal(session: AppSession | null, input: JournalPostInput, externalTx?: Tx) {
    const actor = await authorize(session, 'accounts:post');

    const debit = input.lines.reduce((s, l) => s.plus(D(l.debit || 0)), ZERO);
    const credit = input.lines.reduce((s, l) => s.plus(D(l.credit || 0)), ZERO);
    if (!debit.equals(credit)) throw new ValidationError('Debit total must equal credit total');
    if (debit.lte(0)) throw new ValidationError('Journal total must be greater than zero');

    const run = async (tx: Tx) => {
      const period = await findOpenPeriod(tx, input.branchId, input.date);
      await assertAccountsPostable(tx, input.lines);

      const number = await nextJournalNumber(tx, input.date);

      const entry = await tx.journalEntry.create({
        data: {
          number,
          branchId: input.branchId,
          periodId: period.id,
          date: input.date,
          memo: input.memo || null,
          reference: input.reference || null,
          status: input.post ? 'POSTED' : 'DRAFT',
          sourceModule: input.sourceModule ?? null,
          sourceRefType: input.sourceRefType ?? null,
          sourceRefId: input.sourceRefId ?? null,
          totalDebit: debit,
          totalCredit: credit,
          createdById: actor.userId,
          postedById: input.post ? actor.userId : null,
          postedAt: input.post ? new Date() : null,
          lines: {
            create: input.lines.map((l, idx) => ({
              lineNo: idx + 1,
              accountId: l.accountId,
              debit: D(l.debit || 0),
              credit: D(l.credit || 0),
              currency: l.currency,
              fxRate: D(l.fxRate),
              memo: l.memo || null,
              costCenter: l.costCenter || null,
            })),
          },
        },
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: input.branchId,
          module: 'accounts',
          action: input.post ? 'post' : 'create-draft',
          entityType: 'JournalEntry',
          entityId: entry.id,
          after: { number: entry.number, totalDebit: debit.toString(), status: entry.status },
        },
        tx,
      );
      return entry;
    };

    return externalTx ? run(externalTx) : prisma.$transaction(run);
  },

  async listEntries(
    session: AppSession | null,
    filters: {
      branchId?: string;
      status?: 'DRAFT' | 'POSTED' | 'VOIDED';
      from?: Date;
      to?: Date;
      accountId?: string;
      take?: number;
    } = {},
  ) {
    await authorize(session, 'accounts:read');
    return prisma.journalEntry.findMany({
      where: {
        branchId: filters.branchId,
        status: filters.status,
        date: {
          gte: filters.from,
          lte: filters.to,
        },
        lines: filters.accountId ? { some: { accountId: filters.accountId } } : undefined,
      },
      include: { branch: true, period: true },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: filters.take ?? 100,
    });
  },

  async getEntry(session: AppSession | null, id: string) {
    await authorize(session, 'accounts:read');
    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        branch: true,
        period: true,
        lines: {
          include: { account: true },
          orderBy: { lineNo: 'asc' },
        },
        reverses: true,
        reversedBy: true,
      },
    });
    if (!entry) throw new NotFoundError('Journal entry not found');
    return entry;
  },

  async postDraft(session: AppSession | null, id: string) {
    const actor = await authorize(session, 'accounts:post');
    return prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.findUnique({ where: { id }, include: { lines: true } });
      if (!entry) throw new NotFoundError('Journal entry not found');
      if (entry.status !== 'DRAFT') throw new ValidationError('Only draft entries can be posted');
      const period = await tx.period.findUnique({ where: { id: entry.periodId } });
      if (!period || period.status !== 'OPEN') throw new ValidationError('Period is not open');

      const updated = await tx.journalEntry.update({
        where: { id },
        data: { status: 'POSTED', postedById: actor.userId, postedAt: new Date() },
      });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: entry.branchId,
          module: 'accounts',
          action: 'post',
          entityType: 'JournalEntry',
          entityId: entry.id,
          before: { status: entry.status },
          after: { status: 'POSTED' },
        },
        tx,
      );
      return updated;
    });
  },

  /**
   * Reverse-entry void: creates a mirror JE with debit/credit swapped and
   * links via reversesId. Posted entries are never mutated.
   */
  async voidEntry(session: AppSession | null, input: JournalVoidInput) {
    const actor = await authorize(session, 'accounts:void');
    return prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.findUnique({
        where: { id: input.id },
        include: { lines: true },
      });
      if (!entry) throw new NotFoundError('Journal entry not found');
      if (entry.status !== 'POSTED') throw new ValidationError('Only posted entries can be voided');
      if (entry.reversesId) throw new ValidationError('Cannot void a reversal entry');

      const existingReversal = await tx.journalEntry.findUnique({ where: { reversesId: entry.id } });
      if (existingReversal) throw new ValidationError('Entry has already been reversed');

      const period = await findOpenPeriod(tx, entry.branchId, new Date());

      const number = await nextJournalNumber(tx, new Date());
      const reversal = await tx.journalEntry.create({
        data: {
          number,
          branchId: entry.branchId,
          periodId: period.id,
          date: new Date(),
          memo: `Reversal of ${entry.number}: ${input.reason}`,
          reference: entry.reference,
          status: 'POSTED',
          reversesId: entry.id,
          totalDebit: entry.totalCredit,
          totalCredit: entry.totalDebit,
          createdById: actor.userId,
          postedById: actor.userId,
          postedAt: new Date(),
          lines: {
            create: entry.lines.map((l) => ({
              lineNo: l.lineNo,
              accountId: l.accountId,
              debit: l.credit,
              credit: l.debit,
              currency: l.currency,
              fxRate: l.fxRate,
              memo: l.memo,
              costCenter: l.costCenter,
            })),
          },
        },
      });

      await tx.journalEntry.update({
        where: { id: entry.id },
        data: { status: 'VOIDED', voidedById: actor.userId, voidedAt: new Date() },
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: entry.branchId,
          module: 'accounts',
          action: 'void',
          entityType: 'JournalEntry',
          entityId: entry.id,
          before: { status: 'POSTED' },
          after: { status: 'VOIDED', reversalNumber: reversal.number, reason: input.reason },
        },
        tx,
      );
      return { entry, reversal };
    });
  },

  async resolveSystemAccount(tx: Tx, key: SystemAccountKey, branchId: string | null) {
    const branchMap = branchId
      ? await tx.systemAccountMapping.findFirst({ where: { key, branchId } })
      : null;
    const globalMap = branchMap
      ? null
      : await tx.systemAccountMapping.findFirst({ where: { key, branchId: null } });
    const map = branchMap ?? globalMap;
    if (!map) throw new ValidationError(`System account "${key}" is not mapped`);
    return map.accountId;
  },

  async trialBalance(
    session: AppSession | null,
    filters: { branchId?: string; asOf?: Date } = {},
  ) {
    await authorize(session, 'accounts:read');
    const rows = await prisma.journalEntryLine.groupBy({
      by: ['accountId'],
      where: {
        entry: {
          status: 'POSTED',
          branchId: filters.branchId,
          date: filters.asOf ? { lte: filters.asOf } : undefined,
        },
      },
      _sum: { debit: true, credit: true },
    });
    const accounts = await prisma.chartAccount.findMany({
      where: { id: { in: rows.map((r) => r.accountId) } },
    });
    const byId = new Map(accounts.map((a) => [a.id, a]));
    return rows
      .map((r) => {
        const acc = byId.get(r.accountId);
        const debit = r._sum.debit ?? ZERO;
        const credit = r._sum.credit ?? ZERO;
        return {
          accountId: r.accountId,
          code: acc?.code ?? '',
          name: acc?.name ?? '',
          type: acc?.type ?? 'ASSET',
          debit,
          credit,
          balance: debit.minus(credit),
        };
      })
      .sort((a, b) => a.code.localeCompare(b.code));
  },
};
