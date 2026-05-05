import Link from 'next/link';
import { Plus, BookOpen, ListChecks, BarChart3, TrendingUp, Scale, Lock, Droplets, Users, FileText } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { accountsService } from '@/server/services/accounts.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Accounts & Finance' };

const STATUS_VARIANT: Record<string, 'default' | 'outline' | 'success' | 'warning' | 'destructive'> = {
  DRAFT: 'warning',
  POSTED: 'success',
  VOIDED: 'destructive',
};

export default async function AccountsOverviewPage() {
  const session = await getSession();
  const entries = await accountsService.listEntries(session, { take: 25 });
  const canPost = session?.permissions.includes('accounts:post') ?? false;

  return (
    <div className="space-y-6">
      <PageHeader title="Accounts & Finance" description="Journal entries, ledgers, period locks, and financial reports.">
        {canPost && (
          <Button asChild>
            <Link href="/accounts/journals/new">
              <Plus className="h-4 w-4" />
              New journal
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <NavCard
          icon={<ListChecks className="h-5 w-5 text-primary" />}
          title="Journals"
          subtitle="Manual & system-generated entries"
          href="/accounts/journals"
        />
        <NavCard
          icon={<BookOpen className="h-5 w-5 text-primary" />}
          title="Account ledger"
          subtitle="Per-account transaction history"
          href="/accounts/ledger"
        />
        <NavCard
          icon={<BarChart3 className="h-5 w-5 text-primary" />}
          title="Trial balance"
          subtitle="Debit / credit summary by account"
          href="/accounts/trial-balance"
        />
        <NavCard
          icon={<Scale className="h-5 w-5 text-primary" />}
          title="Balance sheet"
          subtitle="Assets vs. liabilities + equity"
          href="/accounts/balance-sheet"
        />
        <NavCard
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          title="Income statement"
          subtitle="Revenue, expenses, net profit"
          href="/accounts/income-statement"
        />
        <NavCard
          icon={<Droplets className="h-5 w-5 text-primary" />}
          title="Cash Flow Statement"
          subtitle="Operating, investing & financing flows"
          href="/accounts/cash-flow"
        />
        <NavCard
          icon={<Users className="h-5 w-5 text-primary" />}
          title="Changes in Equity"
          subtitle="Share capital & retained earnings movements"
          href="/accounts/equity-changes"
        />
        <NavCard
          icon={<FileText className="h-5 w-5 text-primary" />}
          title="Financial Notes"
          subtitle="PP&E schedule, inventories, advances"
          href="/accounts/financial-notes"
        />
        <NavCard
          icon={<Lock className="h-5 w-5 text-primary" />}
          title="Fiscal periods"
          subtitle="Lock & close accounting periods"
          href="/accounts/periods"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">Recent journal entries</h2>
          <Link href="/accounts/journals" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Number</th>
                <th className="text-left font-semibold px-4 py-3">Date</th>
                <th className="text-left font-semibold px-4 py-3">Branch</th>
                <th className="text-left font-semibold px-4 py-3">Memo</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Debit</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                    No journal entries yet.
                  </td>
                </tr>
              )}
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link href={`/accounts/journals/${e.id}`} className="text-primary hover:underline">
                      {e.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{e.date.toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-3">{e.branch.code}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{e.memo ?? '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{e.totalDebit.toString()}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[e.status] ?? 'outline'}>{e.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function NavCard({
  icon,
  title,
  subtitle,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary transition-colors">
        <CardContent className="p-5 flex items-start gap-3">
          <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">{icon}</div>
          <div>
            <div className="font-semibold text-sm">{title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
