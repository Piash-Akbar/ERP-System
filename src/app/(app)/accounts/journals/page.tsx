import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { accountsService } from '@/server/services/accounts.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Journal entries' };

const STATUS_VARIANT: Record<string, 'default' | 'outline' | 'success' | 'warning' | 'destructive'> = {
  DRAFT: 'warning',
  POSTED: 'success',
  VOIDED: 'destructive',
};

export default async function JournalsPage() {
  const session = await getSession();
  const entries = await accountsService.listEntries(session, { take: 200 });
  const canPost = session?.permissions.includes('accounts:post') ?? false;

  return (
    <div>
      <PageHeader title="Journal entries" description="All manual and system-generated ledger entries.">
        {canPost && (
          <Button asChild>
            <Link href="/accounts/journals/new">
              <Plus className="h-4 w-4" />
              New journal
            </Link>
          </Button>
        )}
      </PageHeader>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Number</th>
                <th className="text-left font-semibold px-4 py-3">Date</th>
                <th className="text-left font-semibold px-4 py-3">Branch</th>
                <th className="text-left font-semibold px-4 py-3">Period</th>
                <th className="text-left font-semibold px-4 py-3">Reference</th>
                <th className="text-left font-semibold px-4 py-3">Memo</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Debit</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Credit</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={9}>
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
                  <td className="px-4 py-3 text-xs text-muted-foreground">{e.period.name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{e.reference ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{e.memo ?? '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{e.totalDebit.toString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{e.totalCredit.toString()}</td>
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
