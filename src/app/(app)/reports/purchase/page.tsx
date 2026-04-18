import { getSession } from '@/server/auth/session';
import { reportsService } from '@/server/services/reports.service';
import { branchService } from '@/server/services/branch.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { defaultRange, RangeFilter } from '../_components/range-filter';

export const metadata = { title: 'Purchase report' };

export default async function PurchaseReportPage({
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
    reportsService.purchaseSummary(session, {
      from: new Date(from),
      to: new Date(to + 'T23:59:59.999Z'),
      branchId: sp.branchId || undefined,
    }),
    branchService.listActive(session),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Purchase summary" description={`${from} → ${to}`}>
        <RangeFilter
          from={from}
          to={to}
          branchId={sp.branchId}
          branches={branches.map((b) => ({ id: b.id, code: b.code, name: b.name }))}
        />
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Kpi label="Purchase orders" value={`${data.poCount}`} />
        <Kpi label="PO value" value={data.poTotal.toString()} />
        <Kpi label="Invoices received" value={`${data.invoiceCount}`} />
        <Kpi label="Invoice value" value={data.invoiceTotal.toString()} />
        <Kpi label="Paid to suppliers" value={data.invoicePaid.toString()} />
        <Kpi label="Outstanding payable" value={data.openPayable.toString()} accent />
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`text-2xl font-semibold tabular-nums mt-1 ${accent ? 'text-primary' : ''}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
