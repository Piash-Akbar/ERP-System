import { getSession } from '@/server/auth/session';
import { hrService } from '@/server/services/hr.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { decideLeaveAction } from '@/server/actions/hr';
import { LEAVE_TYPES } from '@/server/validators/hr';
import { NewLeaveForm } from './_components/new-leave-form';

export const metadata = { title: 'Leaves' };

const STATUS_VARIANT: Record<string, 'default' | 'outline' | 'success' | 'warning' | 'destructive'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
  CANCELLED: 'outline',
};

export default async function LeavesPage() {
  const session = await getSession();
  const [leaves, employees] = await Promise.all([
    hrService.listLeaves(session),
    hrService.listEmployees(session, { status: 'ACTIVE' }),
  ]);
  const canDecide = session?.permissions.includes('hr:leave-approve') ?? false;
  const canCreate = session?.permissions.includes('hr:write') ?? false;

  return (
    <div className="space-y-6">
      <PageHeader title="Leaves" description="Leave requests, approvals & history." />

      {canCreate && (
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-semibold mb-3">New leave request</div>
            <NewLeaveForm
              employees={employees.map((e) => ({ id: e.id, code: e.code, name: `${e.firstName} ${e.lastName}` }))}
              types={[...LEAVE_TYPES]}
            />
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Employee</th>
                <th className="text-left font-semibold px-4 py-3">Type</th>
                <th className="text-left font-semibold px-4 py-3">From</th>
                <th className="text-left font-semibold px-4 py-3">To</th>
                <th className="text-right font-semibold px-4 py-3">Days</th>
                <th className="text-left font-semibold px-4 py-3">Reason</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                {canDecide && <th className="text-right font-semibold px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {leaves.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No leave requests.
                  </td>
                </tr>
              )}
              {leaves.map((l) => (
                <tr key={l.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{l.employee.firstName} {l.employee.lastName}</div>
                    <div className="text-xs text-muted-foreground font-mono">{l.employee.code}</div>
                  </td>
                  <td className="px-4 py-3"><Badge variant="outline">{l.type}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{l.fromDate.toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.toDate.toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{l.days}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{l.reason ?? '—'}</td>
                  <td className="px-4 py-3"><Badge variant={STATUS_VARIANT[l.status] ?? 'outline'}>{l.status}</Badge></td>
                  {canDecide && (
                    <td className="px-4 py-3">
                      {l.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <DecideForm id={l.id} decision="APPROVED" label="Approve" />
                          <DecideForm id={l.id} decision="REJECTED" label="Reject" danger />
                        </div>
                      ) : null}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function DecideForm({ id, decision, label, danger }: { id: string; decision: 'APPROVED' | 'REJECTED'; label: string; danger?: boolean }) {
  return (
    <form action={decideLeaveAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="decision" value={decision} />
      <Button type="submit" size="sm" variant={danger ? 'destructive' : 'outline'}>{label}</Button>
    </form>
  );
}
