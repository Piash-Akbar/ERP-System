import Link from 'next/link';
import {
  ShoppingCart,
  Truck,
  Boxes,
  AlertTriangle,
  ClipboardCheck,
  Receipt,
  Banknote,
  History,
} from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { reportsService } from '@/server/services/reports.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Dashboard' };

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default async function DashboardPage() {
  const session = await getSession();
  const activeBranchId = session?.activeBranchId ?? undefined;
  const from = startOfMonth();
  const to = new Date();

  const canReports = session?.permissions.includes('reports:read') ?? false;

  const [kpis, pendingApprovals, recentSales, recentPayments, notifications, lowStockSample] =
    await Promise.all([
      canReports
        ? reportsService.dashboardKpis(session, { branchId: activeBranchId, from, to })
        : null,
      prisma.approvalRequest.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.posSale.findMany({
        where: { saleDate: { gte: from, lte: to } },
        orderBy: { saleDate: 'desc' },
        take: 6,
        include: { branch: true, customer: true },
      }),
      prisma.supplierPayment.findMany({
        where: { paymentDate: { gte: from, lte: to } },
        orderBy: { paymentDate: 'desc' },
        take: 5,
        include: { supplier: true, branch: true },
      }),
      session?.userId
        ? prisma.notification.findMany({
            where: { recipientId: session.userId, readAt: null },
            orderBy: { createdAt: 'desc' },
            take: 5,
          })
        : Promise.resolve([]),
      canReports
        ? reportsService
            .inventoryValuation(session, { branchId: activeBranchId })
            .then((r) => r.rows.filter((x) => x.belowReorder).slice(0, 5))
        : Promise.resolve([]),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${session?.name ?? 'there'}. Month-to-date snapshot.`}
      />

      {kpis ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Kpi icon={ShoppingCart} label="Sales (MTD)" value={kpis.salesGross.toString()} sub={`${kpis.salesCount} invoices`} href="/reports/sales" accent />
          <Kpi icon={Receipt} label="Receivable" value={kpis.salesOutstanding.toString()} sub="Unpaid sales" href="/reports/sales" />
          <Kpi icon={Truck} label="Purchases (MTD)" value={kpis.purchaseTotal.toString()} sub="Invoices received" href="/reports/purchase" />
          <Kpi icon={Banknote} label="Payable" value={kpis.purchaseOutstanding.toString()} sub="Open supplier bills" href="/reports/purchase" />
          <Kpi icon={Boxes} label="Stock value" value={kpis.inventoryValue.toString()} sub={`${kpis.activeProducts} active products`} href="/reports/inventory" />
          <Kpi icon={AlertTriangle} label="Low stock" value={`${kpis.lowStockProducts}`} sub="Below reorder level" href="/reports/inventory" tone={kpis.lowStockProducts > 0 ? 'warning' : undefined} />
          <Kpi icon={ClipboardCheck} label="Pending approvals" value={`${kpis.pendingApprovals}`} sub="Awaiting decision" href="/approvals" tone={kpis.pendingApprovals > 0 ? 'warning' : undefined} />
          <Kpi icon={History} label="Audit log" value="View" sub="System activity" href="/audit" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            You don&apos;t have permission to view report KPIs.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PanelCard
          title="Pending approvals"
          href="/approvals"
          emptyText="No pending approvals."
          rows={pendingApprovals.map((a) => ({
            key: a.id,
            primary: a.title,
            secondary: `${a.module} · ${a.action}${a.amount ? ` · ${a.amount.toString()}` : ''}`,
            right: <Badge variant="warning">{a.status}</Badge>,
          }))}
        />
        <PanelCard
          title="Unread notifications"
          href="/notifications"
          emptyText="All clear."
          rows={notifications.map((n) => ({
            key: n.id,
            primary: n.title,
            secondary: n.body ?? n.module,
            right: <Badge variant={severityVariant(n.severity)}>{n.severity}</Badge>,
          }))}
        />
        <PanelCard
          title="Recent POS sales"
          href="/pos"
          emptyText="No POS sales this month."
          rows={recentSales.map((s) => ({
            key: s.id,
            primary: s.number,
            secondary: `${s.branch.code} · ${s.customer?.name ?? 'Walk-in'}`,
            right: <span className="tabular-nums font-semibold">{s.grandTotal.toString()}</span>,
          }))}
        />
        <PanelCard
          title="Recent supplier payments"
          href="/suppliers"
          emptyText="No payments this month."
          rows={recentPayments.map((p) => ({
            key: p.id,
            primary: p.supplier.name,
            secondary: `${p.branch.code} · ${p.paymentDate.toISOString().slice(0, 10)}`,
            right: <span className="tabular-nums font-semibold">{p.amount.toString()}</span>,
          }))}
        />
      </div>

      {lowStockSample.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Low-stock alert</h3>
            <Link href="/reports/inventory" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-2">SKU</th>
                <th className="text-left font-semibold px-4 py-2">Product</th>
                <th className="text-right font-semibold px-4 py-2 tabular-nums">On hand</th>
                <th className="text-right font-semibold px-4 py-2 tabular-nums">Reorder at</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {lowStockSample.map((r) => (
                <tr key={r.productId}>
                  <td className="px-4 py-2 font-mono text-xs">{r.sku}</td>
                  <td className="px-4 py-2">{r.name}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-destructive font-semibold">
                    {r.qty.toString()}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                    {r.reorderLevel.toString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function severityVariant(
  s: string,
): 'default' | 'outline' | 'success' | 'warning' | 'destructive' {
  if (s === 'CRITICAL') return 'destructive';
  if (s === 'WARNING') return 'warning';
  if (s === 'SUCCESS') return 'success';
  return 'default';
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  href,
  accent,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  href: string;
  accent?: boolean;
  tone?: 'warning' | 'danger';
}) {
  const color =
    tone === 'warning' ? 'text-amber-600'
    : tone === 'danger' ? 'text-destructive'
    : accent ? 'text-primary'
    : '';
  return (
    <Link href={href}>
      <Card className="hover:border-primary transition-colors h-full">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className={`text-2xl font-semibold tabular-nums mt-2 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}

function PanelCard({
  title,
  href,
  rows,
  emptyText,
}: {
  title: string;
  href: string;
  rows: { key: string; primary: string; secondary?: string; right?: React.ReactNode }[];
  emptyText: string;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Link href={href} className="text-xs text-primary hover:underline">
          View all
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground text-center">{emptyText}</div>
      ) : (
        <ul className="divide-y">
          {rows.map((r) => (
            <li key={r.key} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{r.primary}</div>
                {r.secondary && (
                  <div className="text-xs text-muted-foreground truncate">{r.secondary}</div>
                )}
              </div>
              {r.right}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
