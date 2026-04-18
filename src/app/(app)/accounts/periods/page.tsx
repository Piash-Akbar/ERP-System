import { getSession } from '@/server/auth/session';
import { accountsService } from '@/server/services/accounts.service';
import { branchService } from '@/server/services/branch.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { setPeriodStatusAction } from '@/server/actions/accounts';
import { NewPeriodForm } from './_components/new-period-form';

export const metadata = { title: 'Fiscal periods' };

const STATUS_VARIANT: Record<string, 'default' | 'outline' | 'success' | 'warning' | 'destructive'> = {
  OPEN: 'success',
  LOCKED: 'warning',
  CLOSED: 'destructive',
};

export default async function PeriodsPage() {
  const session = await getSession();
  const [periods, branches] = await Promise.all([
    accountsService.listPeriods(session),
    branchService.listActive(session),
  ]);
  const canClose = session?.permissions.includes('accounts:close-period') ?? false;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fiscal periods"
        description="Control when journal entries can be posted. Lock to freeze, close to seal."
      />

      {canClose && (
        <Card>
          <CardContent className="p-6">
            <NewPeriodForm branches={branches.map((b) => ({ id: b.id, code: b.code, name: b.name }))} />
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Branch</th>
                <th className="text-left font-semibold px-4 py-3">Name</th>
                <th className="text-left font-semibold px-4 py-3">Starts</th>
                <th className="text-left font-semibold px-4 py-3">Ends</th>
                <th className="text-right font-semibold px-4 py-3">Entries</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                <th className="text-right font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {periods.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No periods defined yet.
                  </td>
                </tr>
              )}
              {periods.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs">{p.branch.code}</span>
                  </td>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.startsAt.toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.endsAt.toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{p._count.journalEntries}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[p.status] ?? 'outline'}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {canClose && p.status !== 'CLOSED' && (
                      <div className="flex items-center justify-end gap-1">
                        {p.status === 'OPEN' && (
                          <StatusForm id={p.id} status="LOCKED" label="Lock" />
                        )}
                        {p.status === 'LOCKED' && (
                          <StatusForm id={p.id} status="OPEN" label="Reopen" />
                        )}
                        <StatusForm id={p.id} status="CLOSED" label="Close" danger />
                      </div>
                    )}
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

function StatusForm({
  id,
  status,
  label,
  danger,
}: {
  id: string;
  status: 'OPEN' | 'LOCKED' | 'CLOSED';
  label: string;
  danger?: boolean;
}) {
  return (
    <form action={setPeriodStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" size="sm" variant={danger ? 'destructive' : 'outline'}>
        {label}
      </Button>
    </form>
  );
}
