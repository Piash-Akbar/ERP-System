import { Suspense } from 'react';
import { TrendingUp, TrendingDown, ArrowRightLeft, Download } from 'lucide-react';
import { Prisma } from '@prisma/client';
import { getSession } from '@/server/auth/session';
import { reportsService } from '@/server/services/reports.service';
import { branchService } from '@/server/services/branch.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const metadata = { title: 'Daily Cash Flow' };

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function CashFlowPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; branchId?: string }>;
}) {
  const sp = await searchParams;
  const today = todayIso();
  const from = sp.from ?? today;
  const to = sp.to ?? today;

  const session = await getSession();
  const [data, branches] = await Promise.all([
    reportsService.cashFlow(session, {
      from: new Date(from),
      to: new Date(to + 'T23:59:59.999Z'),
      branchId: sp.branchId || undefined,
    }),
    branchService.listActive(session),
  ]);

  const exportHref =
    `/api/reports/cash-flow.csv?from=${from}&to=${to}` +
    (sp.branchId ? `&branchId=${sp.branchId}` : '');

  const isSingleDay = from === to;
  const rangeLabel = isSingleDay ? from : `${from} → ${to}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cash Flow"
        description={`Income & outcome for ${rangeLabel}`}
      >
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={exportHref}>
              <Download className="h-4 w-4" />
              Download CSV
            </a>
          </Button>
        </div>
      </PageHeader>

      {/* Date + branch filter */}
      <Card className="p-4">
        <form className="flex flex-wrap items-end gap-3">
          {sp.branchId && <input type="hidden" name="branchId" value={sp.branchId} />}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Branch</label>
            <select
              name="branchId"
              defaultValue={sp.branchId ?? ''}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm min-w-36"
            >
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} · {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">From</label>
            <Input type="date" name="from" defaultValue={from} className="h-9 w-36" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">To</label>
            <Input type="date" name="to" defaultValue={to} className="h-9 w-36" />
          </div>
          <Button type="submit" size="sm">Apply</Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={undefined}
            formAction={`/cash-flow?from=${today}&to=${today}`}
          >
            Today
          </Button>
        </form>
      </Card>

      {/* KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              Total income
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-semibold tabular-nums text-emerald-600">
              {data.totalIncome.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.incomeSources.reduce((s, r) => s + r.count, 0)} transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              Total outcome
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-semibold tabular-nums text-red-600">
              {data.totalOutcome.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.outcomeSources.reduce((s, r) => s + r.count, 0)} transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <ArrowRightLeft className="h-3.5 w-3.5 text-blue-500" />
              Net cash
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p
              className={`text-2xl font-semibold tabular-nums ${
                data.net.gte(0) ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {data.net.gte(0) ? '+' : ''}{data.net.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Income − Outcome</p>
          </CardContent>
        </Card>
      </div>

      {/* Source breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Income breakdown
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2 font-semibold">Source</th>
                <th className="text-right px-4 py-2 font-semibold">Txns</th>
                <th className="text-right px-4 py-2 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.incomeSources.map((r) => (
                <tr key={r.key} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5">{r.label}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{r.count}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium text-emerald-600">
                    {r.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/40 font-semibold">
              <tr>
                <td className="px-4 py-2.5">Total</td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {data.incomeSources.reduce((s, r) => s + r.count, 0)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600">
                  {data.totalIncome.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b text-sm font-medium flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            Outcome breakdown
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2 font-semibold">Source</th>
                <th className="text-right px-4 py-2 font-semibold">Txns</th>
                <th className="text-right px-4 py-2 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.outcomeSources.map((r) => (
                <tr key={r.key} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5">{r.label}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{r.count}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium text-red-600">
                    {r.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
              {data.outcomeSources.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                    No outcome in this period.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-muted/40 font-semibold">
              <tr>
                <td className="px-4 py-2.5">Total</td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {data.outcomeSources.reduce((s, r) => s + r.count, 0)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-red-600">
                  {data.totalOutcome.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </Card>
      </div>

      {/* Full transaction ledger */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b text-sm font-medium">
          All transactions ({data.rows.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Date</th>
                <th className="text-left font-semibold px-4 py-3">Flow</th>
                <th className="text-left font-semibold px-4 py-3">Source</th>
                <th className="text-left font-semibold px-4 py-3">Ref</th>
                <th className="text-left font-semibold px-4 py-3">Party</th>
                <th className="text-left font-semibold px-4 py-3">Method</th>
                <th className="text-left font-semibold px-4 py-3">Branch</th>
                <th className="text-right font-semibold px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    No transactions in this period.
                  </td>
                </tr>
              )}
              {data.rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5 tabular-nums text-xs text-muted-foreground whitespace-nowrap">
                    {r.date.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={r.flow === 'IN' ? 'success' : 'destructive'}>
                      {r.flow === 'IN' ? '↑ IN' : '↓ OUT'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.source}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{r.ref}</td>
                  <td className="px-4 py-2.5">{r.party}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">
                    {r.method.replace(/_/g, ' ').toLowerCase()}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.branch}</td>
                  <td
                    className={`px-4 py-2.5 text-right tabular-nums font-medium ${
                      r.flow === 'IN' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {r.flow === 'IN' ? '+' : '-'}{r.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.rows.length >= 500 && (
          <p className="px-4 py-3 text-xs text-muted-foreground border-t text-center">
            Showing first 500 rows per source. Narrow the date range for complete data.
          </p>
        )}
      </Card>
    </div>
  );
}
