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

  async accountLedger(
    session: AppSession | null,
    filters: { accountId: string; branchId?: string; from?: Date; to?: Date },
  ) {
    await authorize(session, 'accounts:read');
    const account = await prisma.chartAccount.findUnique({ where: { id: filters.accountId } });
    if (!account) throw new NotFoundError('Account not found');

    const lines = await prisma.journalEntryLine.findMany({
      where: {
        accountId: filters.accountId,
        entry: {
          status: 'POSTED',
          branchId: filters.branchId,
          date: { gte: filters.from, lte: filters.to },
        },
      },
      include: { entry: { include: { branch: true } } },
      orderBy: [{ entry: { date: 'asc' } }, { entry: { createdAt: 'asc' } }, { lineNo: 'asc' }],
    });

    let running =
      account.normalSide === 'DEBIT' ? account.openingBalance : account.openingBalance.negated();
    const rows = lines.map((l) => {
      const delta = account.normalSide === 'DEBIT' ? l.debit.minus(l.credit) : l.credit.minus(l.debit);
      running = running.plus(delta);
      return {
        id: l.id,
        date: l.entry.date,
        entryId: l.entryId,
        number: l.entry.number,
        branchCode: l.entry.branch.code,
        memo: l.memo ?? l.entry.memo ?? '',
        reference: l.entry.reference ?? '',
        debit: l.debit,
        credit: l.credit,
        balance: running,
      };
    });

    return { account, opening: account.openingBalance, rows, closing: running };
  },

  async listPeriods(session: AppSession | null, filters: { branchId?: string } = {}) {
    await authorize(session, 'accounts:read');
    return prisma.period.findMany({
      where: { branchId: filters.branchId },
      include: { branch: true, _count: { select: { journalEntries: true } } },
      orderBy: [{ branchId: 'asc' }, { startsAt: 'desc' }],
    });
  },

  async createPeriod(
    session: AppSession | null,
    input: { branchId: string; name: string; startsAt: Date; endsAt: Date },
  ) {
    const actor = await authorize(session, 'accounts:close-period');
    if (input.endsAt <= input.startsAt) throw new ValidationError('End date must be after start date');
    const overlap = await prisma.period.findFirst({
      where: {
        branchId: input.branchId,
        startsAt: { lte: input.endsAt },
        endsAt: { gte: input.startsAt },
      },
    });
    if (overlap) throw new ValidationError(`Overlaps period "${overlap.name}"`);

    return prisma.$transaction(async (tx) => {
      const p = await tx.period.create({
        data: { branchId: input.branchId, name: input.name, startsAt: input.startsAt, endsAt: input.endsAt },
      });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: input.branchId,
          module: 'accounts',
          action: 'create-period',
          entityType: 'Period',
          entityId: p.id,
          after: { name: p.name, startsAt: p.startsAt, endsAt: p.endsAt },
        },
        tx,
      );
      return p;
    });
  },

  async setPeriodStatus(
    session: AppSession | null,
    input: { id: string; status: 'OPEN' | 'LOCKED' | 'CLOSED' },
  ) {
    const actor = await authorize(session, 'accounts:close-period');
    return prisma.$transaction(async (tx) => {
      const existing = await tx.period.findUnique({ where: { id: input.id } });
      if (!existing) throw new NotFoundError('Period not found');
      if (existing.status === 'CLOSED' && input.status !== 'CLOSED') {
        throw new ValidationError('Closed periods cannot be reopened');
      }
      if (input.status === 'CLOSED') {
        const drafts = await tx.journalEntry.count({
          where: { periodId: input.id, status: 'DRAFT' },
        });
        if (drafts > 0) throw new ValidationError(`${drafts} draft entries must be posted or discarded first`);
      }
      const updated = await tx.period.update({
        where: { id: input.id },
        data: { status: input.status },
      });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: existing.branchId,
          module: 'accounts',
          action: 'period-status',
          entityType: 'Period',
          entityId: existing.id,
          before: { status: existing.status },
          after: { status: updated.status },
        },
        tx,
      );
      return updated;
    });
  },

  async balanceSheet(
    session: AppSession | null,
    filters: { branchId?: string; asOf?: Date } = {},
  ) {
    const tb = await this.trialBalance(session, filters);
    const asset = tb.filter((r) => r.type === 'ASSET');
    const liability = tb.filter((r) => r.type === 'LIABILITY');
    const equity = tb.filter((r) => r.type === 'EQUITY');
    const totalAsset = asset.reduce((s, r) => s.plus(r.balance), ZERO);
    const totalLiability = liability.reduce((s, r) => s.plus(r.credit.minus(r.debit)), ZERO);
    const totalEquity = equity.reduce((s, r) => s.plus(r.credit.minus(r.debit)), ZERO);
    const income = tb
      .filter((r) => r.type === 'INCOME')
      .reduce((s, r) => s.plus(r.credit.minus(r.debit)), ZERO);
    const expense = tb
      .filter((r) => r.type === 'EXPENSE')
      .reduce((s, r) => s.plus(r.debit.minus(r.credit)), ZERO);
    const retained = income.minus(expense);
    return {
      asset,
      liability,
      equity,
      totals: {
        asset: totalAsset,
        liability: totalLiability,
        equity: totalEquity,
        retained,
        liabilityPlusEquity: totalLiability.plus(totalEquity).plus(retained),
      },
    };
  },

  async incomeStatement(
    session: AppSession | null,
    filters: { branchId?: string; from?: Date; to?: Date } = {},
  ) {
    await authorize(session, 'accounts:read');
    const rows = await prisma.journalEntryLine.groupBy({
      by: ['accountId'],
      where: {
        entry: {
          status: 'POSTED',
          branchId: filters.branchId,
          date: { gte: filters.from, lte: filters.to },
        },
      },
      _sum: { debit: true, credit: true },
    });
    const accounts = await prisma.chartAccount.findMany({
      where: { id: { in: rows.map((r) => r.accountId) }, type: { in: ['INCOME', 'EXPENSE'] } },
    });
    const byId = new Map(accounts.map((a) => [a.id, a]));
    const income: { id: string; code: string; name: string; amount: Prisma.Decimal }[] = [];
    const expense: { id: string; code: string; name: string; amount: Prisma.Decimal }[] = [];
    let totalIncome = ZERO;
    let totalExpense = ZERO;
    for (const r of rows) {
      const acc = byId.get(r.accountId);
      if (!acc) continue;
      const d = r._sum.debit ?? ZERO;
      const c = r._sum.credit ?? ZERO;
      if (acc.type === 'INCOME') {
        const amt = c.minus(d);
        income.push({ id: acc.id, code: acc.code, name: acc.name, amount: amt });
        totalIncome = totalIncome.plus(amt);
      } else {
        const amt = d.minus(c);
        expense.push({ id: acc.id, code: acc.code, name: acc.name, amount: amt });
        totalExpense = totalExpense.plus(amt);
      }
    }
    income.sort((a, b) => a.code.localeCompare(b.code));
    expense.sort((a, b) => a.code.localeCompare(b.code));
    return {
      income,
      expense,
      totals: { income: totalIncome, expense: totalExpense, net: totalIncome.minus(totalExpense) },
    };
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

  async cashFlowStatement(
    session: AppSession | null,
    filters: { branchId?: string; from: Date; to: Date },
  ) {
    await authorize(session, 'accounts:read');

    // Net profit for the period
    const is = await this.incomeStatement(session, filters);
    const netProfit = is.totals.net;

    // Depreciation: sum of all asset depreciation entries in the period
    const depreciationRows = await prisma.assetMovement.aggregate({
      _sum: { amount: true },
      where: {
        type: 'DEPRECIATION',
        createdAt: { gte: filters.from, lte: filters.to },
        ...(filters.branchId ? { branchId: filters.branchId } : {}),
      },
    });
    const depreciation = depreciationRows._sum.amount ?? ZERO;

    // Helper: get total balance of a COA type as-of a date
    const balanceByType = async (types: string[], asOf: Date) => {
      const tb = await this.trialBalance(session, { branchId: filters.branchId, asOf });
      return tb
        .filter((r) => types.includes(r.type))
        .reduce((s, r) => {
          const net = r.type === 'ASSET' ? r.debit.minus(r.credit) : r.credit.minus(r.debit);
          return s.plus(net);
        }, ZERO);
    };

    // Changes in working capital (end vs start)
    const startDate = new Date(filters.from.getTime() - 1);
    const [
      inventoryEnd, inventoryStart,
      arEnd, arStart,
      apEnd, apStart,
    ] = await Promise.all([
      balanceByType(['ASSET'], filters.to), // rough proxy — ideally filter by COA code
      balanceByType(['ASSET'], startDate),
      ZERO, ZERO, // AR/AP proxies — populate when COA codes are known
      ZERO, ZERO,
    ]);

    // Inventory change from InventoryLedger
    const invLedger = await prisma.inventoryLedger.groupBy({
      by: ['direction'],
      where: {
        ...(filters.branchId ? { branchId: filters.branchId } : {}),
        createdAt: { gte: filters.from, lte: filters.to },
      },
      _sum: { quantity: true },
    });
    const invIn = invLedger.find((r) => r.direction === 'IN')?._sum.quantity ?? ZERO;
    const invOut = invLedger.find((r) => r.direction === 'OUT')?._sum.quantity ?? ZERO;
    // Use TB-based inventory delta for monetary change
    const inventoryChange = inventoryEnd.minus(inventoryStart).negated();

    // Investing: fixed asset acquisitions in period
    const assetAcquisitions = await prisma.asset.aggregate({
      _sum: { purchaseCost: true },
      where: {
        purchaseDate: { gte: filters.from, lte: filters.to },
        ...(filters.branchId ? { branchId: filters.branchId } : {}),
      },
    });
    const assetPurchases = (assetAcquisitions._sum.purchaseCost ?? ZERO).negated();

    // Financing: equity movements
    const equityStart = await this.trialBalance(session, { branchId: filters.branchId, asOf: startDate });
    const equityEnd = await this.trialBalance(session, { branchId: filters.branchId, asOf: filters.to });
    const equityStartTotal = equityStart.filter((r) => r.type === 'EQUITY').reduce((s, r) => s.plus(r.credit.minus(r.debit)), ZERO);
    const equityEndTotal = equityEnd.filter((r) => r.type === 'EQUITY').reduce((s, r) => s.plus(r.credit.minus(r.debit)), ZERO);
    const shareCapitalChange = equityEndTotal.minus(equityStartTotal);

    const operatingCF = netProfit.plus(depreciation).plus(inventoryChange);
    const investingCF = assetPurchases;
    const financingCF = shareCapitalChange;
    const netChange = operatingCF.plus(investingCF).plus(financingCF);

    // Opening cash: sum of all POSTED journal lines on cash/bank accounts before from
    const cashTBStart = await this.trialBalance(session, { branchId: filters.branchId, asOf: startDate });
    const openingCash = cashTBStart
      .filter((r) => r.code.startsWith('1') && r.type === 'ASSET')
      .reduce((s, r) => s.plus(r.debit.minus(r.credit)), ZERO);
    const closingCash = openingCash.plus(netChange);

    return {
      operating: {
        netProfit,
        depreciation,
        inventoryChange,
        total: operatingCF,
      },
      investing: {
        assetPurchases,
        total: investingCF,
      },
      financing: {
        shareCapitalChange,
        total: financingCF,
      },
      netChange,
      openingCash,
      closingCash,
    };
  },

  async changesInEquity(
    session: AppSession | null,
    filters: { branchId?: string; from: Date; to: Date },
  ) {
    await authorize(session, 'accounts:read');

    const startDate = new Date(filters.from.getTime() - 1);
    const [tbStart, tbEnd] = await Promise.all([
      this.trialBalance(session, { branchId: filters.branchId, asOf: startDate }),
      this.trialBalance(session, { branchId: filters.branchId, asOf: filters.to }),
    ]);

    const equityBalance = (tb: typeof tbStart, name: string) =>
      tb.filter((r) => r.type === 'EQUITY' && r.name.toLowerCase().includes(name.toLowerCase()))
        .reduce((s, r) => s.plus(r.credit.minus(r.debit)), ZERO);

    const shareCapitalStart = equityBalance(tbStart, 'share capital');
    const shareCapitalEnd = equityBalance(tbEnd, 'share capital');

    const is = await this.incomeStatement(session, filters);
    const netProfit = is.totals.net;

    const retainedStart = equityBalance(tbStart, 'retained');
    const retainedEnd = retainedStart.plus(netProfit);

    return {
      current: {
        period: filters.to.getFullYear(),
        openingShareCapital: shareCapitalStart,
        shareCapitalAdded: shareCapitalEnd.minus(shareCapitalStart),
        closeShareCapital: shareCapitalEnd,
        openingRetained: retainedStart,
        netProfit,
        closingRetained: retainedEnd,
        totalEquity: shareCapitalEnd.plus(retainedEnd),
      },
    };
  },

  async financialNotes(
    session: AppSession | null,
    filters: { branchId?: string; asOf: Date },
  ) {
    await authorize(session, 'accounts:read');

    // PP&E schedule from Asset model
    const assets = await prisma.asset.findMany({
      where: {
        ...(filters.branchId ? { branchId: filters.branchId } : {}),
        purchaseDate: { lte: filters.asOf },
        status: { not: 'DISPOSED' },
      },
      include: { category: { select: { name: true } } },
    });

    const totalCost = assets.reduce((s, a) => s.plus(a.purchaseCost), ZERO);
    const totalAccumDep = assets.reduce((s, a) => s.plus(a.accumulatedDepreciation), ZERO);
    const totalWDV = totalCost.minus(totalAccumDep);

    const ppe = {
      openingCost: totalCost,
      additions: ZERO,
      closingCost: totalCost,
      openingAccumDep: totalAccumDep,
      depreciationForYear: ZERO,
      closingAccumDep: totalAccumDep,
      writtenDownValue: totalWDV,
      assets: assets.map((a) => ({
        name: a.name,
        category: a.category?.name ?? '—',
        cost: a.purchaseCost,
        accumDep: a.accumulatedDepreciation,
        wdv: a.purchaseCost.minus(a.accumulatedDepreciation),
      })),
    };

    // Inventory breakdown from InventoryLedger aggregated by product type
    const invRows = await prisma.$queryRaw<{ type: string; value: number }[]>`
      SELECT p.type, COALESCE(SUM(CASE WHEN il.direction = 'IN' THEN il.quantity ELSE -il.quantity END * il."costPerUnit"), 0) as value
      FROM "InventoryLedger" il
      JOIN "Product" p ON p.id = il."productId"
      WHERE il."createdAt" <= ${filters.asOf}
      ${filters.branchId ? Prisma.sql`AND il."branchId" = ${filters.branchId}` : Prisma.sql``}
      GROUP BY p.type
    `;

    const invByType = new Map(invRows.map((r) => [r.type, new Prisma.Decimal(r.value)]));
    const inventories = {
      rawMaterials: invByType.get('RAW_MATERIAL') ?? ZERO,
      wip: invByType.get('WORK_IN_PROGRESS') ?? ZERO,
      finishedGoods: invByType.get('FINISHED_GOOD') ?? ZERO,
      total: ZERO as Prisma.Decimal,
    };
    inventories.total = inventories.rawMaterials.plus(inventories.wip).plus(inventories.finishedGoods);

    // Advances: sub-accounts with "advance" or "deposit" in name
    const advanceTB = await this.trialBalance(session, { branchId: filters.branchId, asOf: filters.asOf });
    const advances = advanceTB
      .filter((r) => r.type === 'ASSET' && (r.name.toLowerCase().includes('advance') || r.name.toLowerCase().includes('deposit')))
      .map((r) => ({ code: r.code, name: r.name, amount: r.debit.minus(r.credit) }));

    return { ppe, inventories, advances };
  },
};
