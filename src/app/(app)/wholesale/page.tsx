import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Package, Wallet, AlertTriangle, Receipt } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { KpiCard } from '@/components/shared/kpi-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/data-table';
import { Pill, type PillTone } from '@/components/shared/pill';
import { getSession } from '@/server/auth/session';
import { wholesaleService } from '@/server/services/wholesale.service';
import { formatCurrency } from '@/lib/money';

export const metadata = { title: 'Wholesale' };

const STATUS_TONE: Record<string, PillTone> = {
  CONFIRMED: 'blue',
  PARTIALLY_PAID: 'amber',
  PAID: 'green',
  OVERDUE: 'red',
  VOIDED: 'grey',
  PARTIALLY_RETURNED: 'amber',
  RETURNED: 'grey',
  DRAFT: 'grey',
};

export default async function WholesaleOverviewPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const branchId = session.activeBranchId ?? undefined;
  const { totals, overdue, recent } = await wholesaleService.dashboardStats(session, branchId);

  const billed = totals._sum.grandTotal?.toString() ?? '0';
  const collected = totals._sum.paidTotal?.toString() ?? '0';
  const outstanding = totals._sum.balanceDue?.toString() ?? '0';

  return (
    <div className="space-y-6">
      <PageHeader title="Wholesale" description="Bulk billing, credit terms, and due tracking.">
        <Button variant="outline" asChild>
          <Link href="/wholesale/invoices">All invoices</Link>
        </Button>
        <Button variant="dark" asChild>
          <Link href="/wholesale/new">New invoice</Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Invoices" value={totals._count} icon={Receipt} />
        <KpiCard label="Billed" value={formatCurrency(billed, 'BDT')} icon={Package} tone="primary" />
        <KpiCard
          label="Collected"
          value={formatCurrency(collected, 'BDT')}
          icon={Wallet}
          tone="success"
        />
        <KpiCard
          label="Outstanding"
          value={formatCurrency(outstanding, 'BDT')}
          icon={AlertTriangle}
          tone={overdue > 0 ? 'danger' : 'warning'}
          description={overdue > 0 ? `${overdue} overdue` : 'All current'}
        />
      </div>

      <Card className="p-0">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="text-sm font-medium">Recent invoices</div>
          <Link href="/wholesale/invoices" className="text-xs text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        <DataTable
          rows={recent}
          rowKey={(r) => r.id}
          empty="No invoices yet."
          columns={[
            {
              key: 'number',
              header: 'Number',
              cell: (r) => (
                <Link
                  href={`/wholesale/invoices/${r.id}`}
                  className="text-blue-600 hover:underline tabular"
                >
                  {r.number}
                </Link>
              ),
            },
            {
              key: 'customer',
              header: 'Customer',
              cell: (r) => `${r.customer.code} · ${r.customer.name}`,
            },
            {
              key: 'date',
              header: 'Date',
              cell: (r) => <span className="tabular">{r.invoiceDate.toISOString().slice(0, 10)}</span>,
            },
            {
              key: 'total',
              header: 'Total',
              align: 'right',
              cell: (r) => (
                <span className="tabular font-medium">
                  {formatCurrency(r.grandTotal, r.currency)}
                </span>
              ),
            },
            {
              key: 'due',
              header: 'Balance',
              align: 'right',
              cell: (r) =>
                r.balanceDue.gt(0) ? (
                  <span className="tabular text-red-600">
                    {formatCurrency(r.balanceDue, r.currency)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                ),
            },
            {
              key: 'status',
              header: 'Status',
              cell: (r) => (
                <Pill tone={STATUS_TONE[r.status] ?? 'grey'}>
                  {r.status.toLowerCase().replace('_', ' ')}
                </Pill>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
