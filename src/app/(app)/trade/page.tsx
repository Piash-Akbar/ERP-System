import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Ship, FileText, CreditCard, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { KpiCard } from '@/components/shared/kpi-card';
import { Button } from '@/components/ui/button';
import { getSession } from '@/server/auth/session';
import { tradeService } from '@/server/services/trade.service';

export const metadata = { title: 'Export / Import' };

export default async function TradeOverviewPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const branchId = session.activeBranchId ?? undefined;
  const stats = await tradeService.getStats(session, branchId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Export / Import"
        description="Trade orders, shipment tracking, letters of credit and foreign payments."
      >
        <Button variant="outline" asChild>
          <Link href="/trade/lc">Letters of Credit</Link>
        </Button>
        <Button variant="default" asChild>
          <Link href="/trade/orders/new">New Order</Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <KpiCard label="Total Orders" value={stats.totalOrders} icon={Ship} />
        <KpiCard label="Export Orders" value={stats.exportOrders} icon={TrendingUp} tone="primary" />
        <KpiCard label="Import Orders" value={stats.importOrders} icon={FileText} tone="warning" />
        <KpiCard label="Active LCs" value={stats.activeLCs} icon={CreditCard} tone="success" />
        <KpiCard
          label="LCs Expiring (30d)"
          value={stats.expiringLCs}
          icon={AlertTriangle}
          tone={stats.expiringLCs > 0 ? 'danger' : 'success'}
        />
        <KpiCard
          label="Pending Drawdowns"
          value={stats.pendingDrawdowns}
          icon={Clock}
          tone={stats.pendingDrawdowns > 0 ? 'warning' : 'success'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-5 space-y-3">
          <h3 className="font-semibold text-sm">Trade Orders</h3>
          <p className="text-muted-foreground text-sm">
            Manage export and import orders, track shipment stages and compliance status.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/trade/orders">View All Orders</Link>
          </Button>
        </div>

        <div className="rounded-lg border bg-card p-5 space-y-3">
          <h3 className="font-semibold text-sm">Letters of Credit</h3>
          <p className="text-muted-foreground text-sm">
            Issue, amend, and manage LC drawdowns. Monitor expiry and utilization in real time.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/trade/lc">Manage LCs</Link>
          </Button>
        </div>

        <div className="rounded-lg border bg-card p-5 space-y-3">
          <h3 className="font-semibold text-sm">Shipments</h3>
          <p className="text-muted-foreground text-sm">
            Track vessel details, BL numbers, port movements, and customs clearance.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/trade/shipments">View Shipments</Link>
          </Button>
        </div>

        <div className="rounded-lg border bg-card p-5 space-y-3">
          <h3 className="font-semibold text-sm">Foreign Payments</h3>
          <p className="text-muted-foreground text-sm">
            Record SWIFT/TT payments with exchange rates and bank references.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/trade/payments">View Payments</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
