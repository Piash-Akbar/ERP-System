import Link from 'next/link';
import { BarChart3, ShoppingCart, Truck, Package, UsersRound, Banknote, Scale, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = { title: 'Reports & Analytics' };

const REPORTS = [
  { title: 'Sales summary', subtitle: 'POS, wholesale & corporate by channel', href: '/reports/sales', icon: ShoppingCart },
  { title: 'Top products', subtitle: 'Best-selling items across channels', href: '/reports/top-products', icon: BarChart3 },
  { title: 'Purchase summary', subtitle: 'Orders, invoices, payables', href: '/reports/purchase', icon: Truck },
  { title: 'Inventory valuation', subtitle: 'On-hand qty × cost', href: '/reports/inventory', icon: Package },
  { title: 'HR summary', subtitle: 'Headcount, last payroll', href: '/reports/hr', icon: UsersRound },
  { title: 'Trial balance', subtitle: 'GL balances as of date', href: '/accounts/trial-balance', icon: Banknote },
  { title: 'Balance sheet', subtitle: 'Financial position', href: '/accounts/balance-sheet', icon: Scale },
  { title: 'Income statement', subtitle: 'Revenue & expenses', href: '/accounts/income-statement', icon: TrendingUp },
];

export default function ReportsHubPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" description="Cross-module analytics and exportable reports." />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          return (
            <Link key={r.href} href={r.href}>
              <Card className="hover:border-primary transition-colors h-full">
                <CardContent className="p-5 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{r.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{r.subtitle}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
