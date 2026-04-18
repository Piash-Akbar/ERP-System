import { Prisma } from '@prisma/client';
import { getSession } from '@/server/auth/session';
import { accountsService } from '@/server/services/accounts.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Trial balance' };

const TYPE_VARIANT: Record<string, 'default' | 'outline' | 'success' | 'warning' | 'destructive'> = {
  ASSET: 'success',
  LIABILITY: 'warning',
  EQUITY: 'default',
  INCOME: 'success',
  EXPENSE: 'destructive',
};

export default async function TrialBalancePage({
  searchParams,
}: {
  searchParams: Promise<{ asOf?: string }>;
}) {
  const { asOf } = await searchParams;
  const session = await getSession();
  const asOfDate = asOf ? new Date(asOf) : new Date();
  const rows = await accountsService.trialBalance(session, { asOf: asOfDate });

  const totalDebit = rows.reduce((s, r) => s.plus(r.debit), new Prisma.Decimal(0));
  const totalCredit = rows.reduce((s, r) => s.plus(r.credit), new Prisma.Decimal(0));

  return (
    <div>
      <PageHeader title="Trial balance" description={`Posted entries as of ${asOfDate.toISOString().slice(0, 10)}`}>
        <form className="flex items-center gap-2">
          <input
            type="date"
            name="asOf"
            defaultValue={asOfDate.toISOString().slice(0, 10)}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          />
          <button type="submit" className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm">
            Update
          </button>
        </form>
      </PageHeader>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Code</th>
                <th className="text-left font-semibold px-4 py-3">Account</th>
                <th className="text-left font-semibold px-4 py-3">Type</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Debit</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Credit</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                    No posted entries yet.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.accountId} className="hover:bg-muted/30">
                  <td className="px-4 py-2 font-mono text-xs">{r.code}</td>
                  <td className="px-4 py-2">{r.name}</td>
                  <td className="px-4 py-2">
                    <Badge variant={TYPE_VARIANT[r.type] ?? 'outline'}>{r.type}</Badge>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.debit.toString()}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.credit.toString()}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-semibold">{r.balance.toString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/40 font-semibold">
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right text-xs uppercase">Totals</td>
                <td className="px-4 py-2 text-right tabular-nums">{totalDebit.toString()}</td>
                <td className="px-4 py-2 text-right tabular-nums">{totalCredit.toString()}</td>
                <td
                  className={`px-4 py-2 text-right tabular-nums ${totalDebit.equals(totalCredit) ? 'text-emerald-600' : 'text-destructive'}`}
                >
                  {totalDebit.equals(totalCredit) ? '✓ Balanced' : totalDebit.minus(totalCredit).toString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
