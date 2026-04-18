import Link from 'next/link';
import { getSession } from '@/server/auth/session';
import { accountsService } from '@/server/services/accounts.service';
import { coaService } from '@/server/services/coa.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Account ledger' };

export default async function AccountLedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ accountId?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  const accounts = (await coaService.list(session, { activeOnly: true })).filter((a) => a.isPosting);

  if (!sp.accountId) {
    return (
      <div>
        <PageHeader title="Account ledger" description="Pick a posting account to inspect its transactions." />
        <Card>
          <CardContent className="p-6">
            <ul className="divide-y text-sm">
              {accounts.map((a) => (
                <li key={a.id} className="py-2 flex items-center justify-between">
                  <span>
                    <span className="font-mono text-xs">{a.code}</span> · {a.name}
                  </span>
                  <Link className="text-primary hover:underline text-xs" href={`/accounts/ledger?accountId=${a.id}`}>
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  const from = sp.from ? new Date(sp.from) : undefined;
  const to = sp.to ? new Date(sp.to) : undefined;
  const ledger = await accountsService.accountLedger(session, { accountId: sp.accountId, from, to });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${ledger.account.code} · ${ledger.account.name}`}
        description={`Normal side: ${ledger.account.normalSide} · ${ledger.account.type}`}
      >
        <form className="flex items-center gap-2">
          <input type="hidden" name="accountId" value={sp.accountId} />
          <input
            type="date"
            name="from"
            defaultValue={sp.from ?? ''}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          />
          <span className="text-muted-foreground text-xs">to</span>
          <input
            type="date"
            name="to"
            defaultValue={sp.to ?? ''}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          />
          <button className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm">Apply</button>
        </form>
      </PageHeader>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Date</th>
                <th className="text-left font-semibold px-4 py-3">Entry</th>
                <th className="text-left font-semibold px-4 py-3">Branch</th>
                <th className="text-left font-semibold px-4 py-3">Memo</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Debit</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Credit</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr className="bg-muted/30">
                <td colSpan={6} className="px-4 py-2 text-xs uppercase text-muted-foreground text-right">
                  Opening balance
                </td>
                <td className="px-4 py-2 text-right tabular-nums font-semibold">{ledger.opening.toString()}</td>
              </tr>
              {ledger.rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No posted transactions in range.
                  </td>
                </tr>
              )}
              {ledger.rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2 text-muted-foreground">{r.date.toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-2 font-mono text-xs">
                    <Link href={`/accounts/journals/${r.entryId}`} className="text-primary hover:underline">
                      {r.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant="outline">{r.branchCode}</Badge>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground max-w-xs truncate">{r.memo}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {r.debit.greaterThan(0) ? r.debit.toString() : ''}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {r.credit.greaterThan(0) ? r.credit.toString() : ''}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.balance.toString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/40 font-semibold">
              <tr>
                <td colSpan={6} className="px-4 py-2 text-right text-xs uppercase">Closing balance</td>
                <td className="px-4 py-2 text-right tabular-nums">{ledger.closing.toString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
