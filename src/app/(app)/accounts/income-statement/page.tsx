import { Prisma } from '@prisma/client';
import { getSession } from '@/server/auth/session';
import { accountsService } from '@/server/services/accounts.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';

export const metadata = { title: 'Income statement' };

function defaultRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

export default async function IncomeStatementPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const { from: defaultFrom, to: defaultTo } = defaultRange();
  const fromStr = sp.from ?? defaultFrom;
  const toStr = sp.to ?? defaultTo;
  const session = await getSession();
  const report = await accountsService.incomeStatement(session, {
    from: new Date(fromStr),
    to: new Date(toStr),
  });

  return (
    <div>
      <PageHeader title="Income statement" description={`Profit & loss · ${fromStr} → ${toStr}`}>
        <form className="flex items-center gap-2">
          <input type="date" name="from" defaultValue={fromStr}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
          <span className="text-muted-foreground text-xs">to</span>
          <input type="date" name="to" defaultValue={toStr}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
          <button className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm">Update</button>
        </form>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Income" rows={report.income} total={report.totals.income} color="text-emerald-600" />
        <Section title="Expense" rows={report.expense} total={report.totals.expense} color="text-destructive" />
      </div>

      <Card className="mt-6">
        <div className="p-6 grid grid-cols-3 gap-4 text-sm">
          <KpiCell label="Total income" value={report.totals.income} color="text-emerald-600" />
          <KpiCell label="Total expense" value={report.totals.expense} color="text-destructive" />
          <KpiCell
            label="Net profit / (loss)"
            value={report.totals.net}
            color={report.totals.net.gte(0) ? 'text-emerald-600' : 'text-destructive'}
          />
        </div>
      </Card>
    </div>
  );
}

function KpiCell({ label, value, color }: { label: string; value: Prisma.Decimal; color: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums mt-1 ${color}`}>{value.toString()}</div>
    </div>
  );
}

function Section({
  title,
  rows,
  total,
  color,
}: {
  title: string;
  rows: { id: string; code: string; name: string; amount: Prisma.Decimal }[];
  total: Prisma.Decimal;
  color: string;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className={`text-sm font-semibold tabular-nums ${color}`}>{total.toString()}</span>
      </div>
      <table className="w-full text-sm">
        <tbody className="divide-y">
          {rows.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-muted-foreground text-xs" colSpan={3}>
                No entries in range.
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-2 font-mono text-xs w-24">{r.code}</td>
              <td className="px-4 py-2">{r.name}</td>
              <td className="px-4 py-2 text-right tabular-nums">{r.amount.toString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
