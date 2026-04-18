import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/shared/data-table';
import { Pill } from '@/components/shared/pill';
import { getSession } from '@/server/auth/session';
import { posService } from '@/server/services/pos.service';
import { closePosSessionAction } from '@/server/actions/pos';
import { formatCurrency } from '@/lib/money';

export const metadata = { title: 'POS Sessions' };

export default async function SessionsPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const sessions = await posService.mySessions(session, 50);
  const open = sessions.find((s) => s.status === 'OPEN');

  return (
    <div className="space-y-6">
      <PageHeader title="Cash sessions" description="Your open and past POS sessions.">
        <Button variant="dark" asChild>
          <Link href="/pos">Back to terminal</Link>
        </Button>
      </PageHeader>

      {open && (
        <Card className="p-4 border-emerald-500/40 bg-emerald-50/40">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xs text-muted-foreground">Open session</div>
              <div className="font-medium">{open.warehouse.code} — {open.warehouse.name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Opened {open.openedAt.toLocaleString()} · Float {formatCurrency(open.openingFloat, 'BDT')}
              </div>
            </div>
            <form action={async (fd) => { 'use server'; await closePosSessionAction(fd); }} className="flex items-end gap-2">
              <input type="hidden" name="sessionId" value={open.id} />
              <div>
                <label className="text-xs text-muted-foreground block">Counted cash</label>
                <Input
                  name="countedCash"
                  type="number"
                  min={0}
                  step="any"
                  className="w-40"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block">Notes</label>
                <Input name="notes" className="w-60" />
              </div>
              <Button type="submit" variant="dark">Close session</Button>
            </form>
          </div>
        </Card>
      )}

      <Card className="p-0">
        <DataTable
          rows={sessions}
          rowKey={(r) => r.id}
          empty="No sessions yet."
          columns={[
            {
              key: 'opened',
              header: 'Opened',
              cell: (r) => <span className="tabular">{r.openedAt.toISOString().slice(0, 16).replace('T', ' ')}</span>,
            },
            { key: 'warehouse', header: 'Till', cell: (r) => `${r.warehouse.code} · ${r.warehouse.name}` },
            {
              key: 'float',
              header: 'Float',
              align: 'right',
              cell: (r) => <span className="tabular">{formatCurrency(r.openingFloat, 'BDT')}</span>,
            },
            {
              key: 'expected',
              header: 'Expected',
              align: 'right',
              cell: (r) => <span className="tabular">{formatCurrency(r.expectedCash, 'BDT')}</span>,
            },
            {
              key: 'counted',
              header: 'Counted',
              align: 'right',
              cell: (r) => <span className="tabular">{formatCurrency(r.countedCash, 'BDT')}</span>,
            },
            {
              key: 'variance',
              header: 'Variance',
              align: 'right',
              cell: (r) => {
                const v = Number(r.cashVariance);
                return (
                  <span className={`tabular ${v < 0 ? 'text-red-600' : v > 0 ? 'text-amber-700' : ''}`}>
                    {formatCurrency(r.cashVariance, 'BDT')}
                  </span>
                );
              },
            },
            {
              key: 'status',
              header: 'Status',
              cell: (r) => (
                <Pill tone={r.status === 'OPEN' ? 'black' : 'grey'}>{r.status.toLowerCase()}</Pill>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
