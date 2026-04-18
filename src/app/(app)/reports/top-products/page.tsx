import { getSession } from '@/server/auth/session';
import { reportsService } from '@/server/services/reports.service';
import { branchService } from '@/server/services/branch.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { defaultRange, RangeFilter } from '../_components/range-filter';

export const metadata = { title: 'Top products' };

export default async function TopProductsReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; branchId?: string }>;
}) {
  const sp = await searchParams;
  const d = defaultRange();
  const from = sp.from ?? d.from;
  const to = sp.to ?? d.to;

  const session = await getSession();
  const [rows, branches] = await Promise.all([
    reportsService.topProducts(session, {
      from: new Date(from),
      to: new Date(to + 'T23:59:59.999Z'),
      branchId: sp.branchId || undefined,
      limit: 50,
    }),
    branchService.listActive(session),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Top products" description={`${from} → ${to}`}>
        <RangeFilter
          from={from}
          to={to}
          branchId={sp.branchId}
          branches={branches.map((b) => ({ id: b.id, code: b.code, name: b.name }))}
        />
      </PageHeader>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3 w-10">#</th>
                <th className="text-left font-semibold px-4 py-3">SKU</th>
                <th className="text-left font-semibold px-4 py-3">Product</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Qty sold</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No sales in this range.
                  </td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr key={r.productId} className="hover:bg-muted/30">
                  <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2 font-mono text-xs">{r.sku}</td>
                  <td className="px-4 py-2">{r.name}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.qty.toString()}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.revenue.toString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
