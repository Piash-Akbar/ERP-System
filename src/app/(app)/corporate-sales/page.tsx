import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Building2, FileText, Receipt, AlertTriangle, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { KpiCard } from '@/components/shared/kpi-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSession } from '@/server/auth/session';
import { corporateService } from '@/server/services/corporate-sales.service';
import { formatCurrency } from '@/lib/money';

export const metadata = { title: 'Corporate Sales' };

export default async function CorporateOverviewPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const branchId = session.activeBranchId ?? undefined;
  const { orderAgg, invoiceAgg, openQuotes, overdueInvoices } = await corporateService.dashboardStats(
    session,
    branchId,
  );

  const ordered = orderAgg._sum.grandTotal?.toString() ?? '0';
  const billed = invoiceAgg._sum.grandTotal?.toString() ?? '0';
  const collected = invoiceAgg._sum.paidTotal?.toString() ?? '0';
  const outstanding = invoiceAgg._sum.balanceDue?.toString() ?? '0';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Corporate Sales"
        description="B2B lifecycle — quote, order, delivery, invoice, payment."
      >
        <Button variant="outline" asChild>
          <Link href="/corporate-sales/quotes/new">New quote</Link>
        </Button>
        <Button variant="dark" asChild>
          <Link href="/corporate-sales/orders/new">New order</Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCard label="Open quotes" value={openQuotes} icon={FileText} tone="primary" />
        <KpiCard label="Orders" value={orderAgg._count} description={formatCurrency(ordered, 'BDT')} icon={Building2} />
        <KpiCard label="Billed" value={formatCurrency(billed, 'BDT')} icon={Receipt} tone="primary" />
        <KpiCard label="Collected" value={formatCurrency(collected, 'BDT')} icon={Wallet} tone="success" />
        <KpiCard
          label="Outstanding"
          value={formatCurrency(outstanding, 'BDT')}
          icon={AlertTriangle}
          tone={overdueInvoices > 0 ? 'danger' : 'warning'}
          description={overdueInvoices > 0 ? `${overdueInvoices} overdue` : 'All current'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Workflow</div>
          <h3 className="text-base font-semibold mt-1">Quotes</h3>
          <p className="text-xs text-muted-foreground mt-2">
            Draft, send, accept. Convert an accepted quote into an order with a warehouse.
          </p>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href="/corporate-sales/quotes">Manage quotes</Link>
          </Button>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Workflow</div>
          <h3 className="text-base font-semibold mt-1">Orders & deliveries</h3>
          <p className="text-xs text-muted-foreground mt-2">
            Fulfil orders with partial deliveries — stock leaves inventory on dispatch.
          </p>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href="/corporate-sales/orders">Manage orders</Link>
          </Button>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Workflow</div>
          <h3 className="text-base font-semibold mt-1">Invoices & payments</h3>
          <p className="text-xs text-muted-foreground mt-2">
            Bill delivered quantities, track balance due, record payments against ledger.
          </p>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href="/corporate-sales/invoices">Manage invoices</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
