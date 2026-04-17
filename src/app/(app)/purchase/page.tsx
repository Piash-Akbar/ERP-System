import Link from 'next/link';
import {
  Plus,
  ShoppingCart,
  PackageCheck,
  FileText,
  ClipboardList,
  Receipt,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/shared/kpi-card';
import { AlertBanner } from '@/components/shared/alert-banner';
import { purchaseService } from '@/server/services/purchase.service';
import { getSession } from '@/server/auth/session';
import { formatCurrency } from '@/lib/money';

export const metadata = { title: 'Purchase' };

export default async function PurchaseDashboardPage() {
  const session = await getSession();
  const summary = await purchaseService.dashboardSummary(session);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Dashboard"
        description="Overview of procurement activities"
      >
        <Button variant="outline" asChild>
          <Link href="/purchase/requisitions/new">
            <Plus className="h-4 w-4" />
            Create Requisition
          </Link>
        </Button>
        <Button variant="dark" asChild>
          <Link href="/purchase/orders/new">
            <Plus className="h-4 w-4" />
            Create PO
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Purchase Today"
          value={formatCurrency(summary.todayTotal, 'BDT')}
          icon={ShoppingCart}
          description="Orders placed today"
        />
        <KpiCard
          label="Purchase This Month"
          value={formatCurrency(summary.monthTotal, 'BDT')}
          icon={ShoppingCart}
          description="Month to date"
        />
        <KpiCard
          label="Active Purchase Orders"
          value={summary.activePOs}
          icon={PackageCheck}
          description="Approved or being received"
        />
        <KpiCard
          label="Total Payable"
          value={formatCurrency(summary.totalPayable, 'BDT')}
          tone="danger"
          icon={Wallet}
          description="Outstanding to suppliers"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Pending Requisitions"
          value={summary.pendingPR}
          tone="warning"
          icon={ClipboardList}
          description="Awaiting approval"
        />
        <KpiCard
          label="Pending PO Approval"
          value={summary.pendingPO}
          tone="warning"
          icon={FileText}
          description="Orders need approval"
        />
        <KpiCard
          label="Pending GRN"
          value={summary.pendingGRN}
          tone="primary"
          icon={PackageCheck}
          description="Orders awaiting receipt"
        />
        <Card className="p-5 flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">Quick Action</p>
          <Button variant="dark" asChild>
            <Link href="/purchase/grn/new">
              <PackageCheck className="h-4 w-4" />
              Receive Goods
            </Link>
          </Button>
        </Card>
      </div>

      <AlertBanner tone="warning" title="Golden Rule">
        No inventory can enter the system without a GRN. All goods must be properly received and
        recorded before stock is updated.
      </AlertBanner>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/purchase/requisitions">
          <Card className="p-5 hover:border-primary transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Requisitions</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Department requests awaiting approval
                </p>
              </div>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
        </Link>
        <Link href="/purchase/orders">
          <Card className="p-5 hover:border-primary transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Purchase Orders</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Approved supplier orders
                </p>
              </div>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
        </Link>
        <Link href="/purchase/grn">
          <Card className="p-5 hover:border-primary transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Goods Receive Notes</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Incoming inventory records
                </p>
              </div>
              <PackageCheck className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
        </Link>
        <Link href="/purchase/invoices">
          <Card className="p-5 hover:border-primary transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Purchase Invoices</p>
                <p className="text-xs text-muted-foreground mt-1">Supplier bills (3-way match)</p>
              </div>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
        </Link>
        <Link href="/suppliers/payments">
          <Card className="p-5 hover:border-primary transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Supplier Payments</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Outstanding dues and recent payments
                </p>
              </div>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
