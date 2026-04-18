import { getSession } from '@/server/auth/session';
import { reportsService } from '@/server/services/reports.service';
import { branchService } from '@/server/services/branch.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { defaultRange, RangeFilter } from '../_components/range-filter';

export const metadata = { title: 'Sales report' };

export default async function SalesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; branchId?: string }>;
}) {
  const sp = await searchParams;
  const d = defaultRange();
  const from = sp.from ?? d.from;
  const to = sp.to ?? d.to;

  const session = await getSession();
  const [data, branches] = await Promise.all([
    reportsService.salesSummary(session, {
      from: new Date(from),
      to: new Date(to + 'T23:59:59.999Z'),
      branchId: sp.branchId || undefined,
    }),
    branchService.listActive(session),
  ]);

  const exportHref = `/api/reports/sales.csv?from=${from}&to=${to}${sp.branchId ? `&branchId=${sp.branchId}` : ''}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Sales summary" description={`${from} → ${to}`}>
        <RangeFilter
          from={from}
          to={to}
          branchId={sp.branchId}
          branches={branches.map((b) => ({ id: b.id, code: b.code, name: b.name }))}
          exportHref={exportHref}
        />
      </PageHeader>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Channel</th>
                <th className="text-right font-semibold px-4 py-3">Invoices</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Gross</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Discount</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Tax</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Paid</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.channels.map((c) => (
                <tr key={c.key}>
                  <td className="px-4 py-2 font-medium">{c.label}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{c.count}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{c.gross.toString()}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{c.discount.toString()}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{c.tax.toString()}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{c.paid.toString()}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{c.outstanding.toString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/40 font-semibold">
              <tr>
                <td className="px-4 py-2">Totals</td>
                <td className="px-4 py-2 text-right tabular-nums">{data.totals.count}</td>
                <td className="px-4 py-2 text-right tabular-nums">{data.totals.gross.toString()}</td>
                <td className="px-4 py-2 text-right tabular-nums">{data.totals.discount.toString()}</td>
                <td className="px-4 py-2 text-right tabular-nums">{data.totals.tax.toString()}</td>
                <td className="px-4 py-2 text-right tabular-nums">{data.totals.paid.toString()}</td>
                <td className="px-4 py-2 text-right tabular-nums">{data.totals.outstanding.toString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
