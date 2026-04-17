import Link from 'next/link';
import { getSession } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Users, Network, ShieldCheck, History } from 'lucide-react';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const session = await getSession();

  const [userCount, branchCount, roleCount, auditCount] = await Promise.all([
    prisma.user.count(),
    prisma.branch.count(),
    prisma.role.count(),
    prisma.auditLog.count(),
  ]);

  const tiles = [
    { label: 'Users', value: userCount, href: '/users', icon: Users },
    { label: 'Branches', value: branchCount, href: '/branches', icon: Network },
    { label: 'Roles', value: roleCount, href: '/users', icon: ShieldCheck },
    { label: 'Audit events', value: auditCount, href: '/audit', icon: History },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${session?.name ?? 'there'}. Here is a snapshot of the system.`}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Link key={t.label} href={t.href}>
              <Card className="p-5 hover:border-primary transition-colors">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t.label}</p>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-3xl font-semibold mt-2 tabular">{t.value.toLocaleString()}</p>
              </Card>
            </Link>
          );
        })}
      </div>
      <Card className="mt-6 p-6">
        <p className="text-sm text-muted-foreground">
          Full dashboard (KPIs, charts, approval queue, recent activity, system alerts) lands in
          Phase 7 once the operational modules feed it.
        </p>
      </Card>
    </div>
  );
}
