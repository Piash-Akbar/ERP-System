import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { Pill, type PillTone } from '@/components/shared/pill';
import { Button } from '@/components/ui/button';
import { getSession } from '@/server/auth/session';
import { tradeService } from '@/server/services/trade.service';
import { formatCurrency } from '@/lib/money';

export const metadata = { title: 'Letters of Credit' };

const LC_STATUS_TONE: Record<string, PillTone> = {
  DRAFT: 'grey', ISSUED: 'blue', ADVISED: 'blue', CONFIRMED: 'green',
  ACTIVE: 'green', AMENDED: 'amber', PARTIALLY_UTILIZED: 'amber',
  FULLY_UTILIZED: 'grey', EXPIRED: 'red', CLOSED: 'grey', CANCELLED: 'red',
};

function isExpiringSoon(expiryDate: Date) {
  return new Date(expiryDate).getTime() - Date.now() < 30 * 86400000;
}

const TERMINAL = ['EXPIRED', 'CLOSED', 'CANCELLED', 'FULLY_UTILIZED'];

type Row = Awaited<ReturnType<typeof tradeService.listLCs>>[number];

const columns: DataTableColumn<Row>[] = [
  {
    key: 'number', header: 'LC Number',
    cell: (r) => (
      <Link href={`/trade/lc/${r.id}`} className="font-mono text-primary hover:underline">
        {r.number}
      </Link>
    ),
  },
  {
    key: 'tradeOrder', header: 'Trade Order',
    cell: (r) => (
      <Link href={`/trade/orders/${r.tradeOrder.id}`} className="text-xs text-primary hover:underline">
        {r.tradeOrder.number}
      </Link>
    ),
  },
  {
    key: 'type', header: 'Type',
    cell: (r) => <span className="text-xs">{r.type.replace(/_/g, ' ')}</span>,
  },
  {
    key: 'amount', header: 'LC Amount', align: 'right',
    cell: (r) => formatCurrency(r.lcAmount.toString(), r.currency),
  },
  {
    key: 'available', header: 'Available', align: 'right',
    cell: (r) => formatCurrency(r.availableAmount.toString(), r.currency),
  },
  {
    key: 'expiry', header: 'Expiry',
    cell: (r) => {
      const expiring = isExpiringSoon(r.expiryDate) && !TERMINAL.includes(r.status);
      return (
        <span className={expiring ? 'text-red-600 font-medium flex items-center gap-1' : ''}>
          {expiring && <AlertTriangle className="h-3 w-3 inline mr-1" />}
          {new Date(r.expiryDate).toLocaleDateString()}
        </span>
      );
    },
  },
  {
    key: 'drawdowns', header: 'Drawdowns', align: 'right',
    cell: (r) => r._count.drawdowns,
  },
  {
    key: 'status', header: 'Status',
    cell: (r) => (
      <Pill tone={LC_STATUS_TONE[r.status] ?? 'grey'}>{r.status.replace(/_/g, ' ')}</Pill>
    ),
  },
];

export default async function LCListPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const rows = await tradeService.listLCs(session, {
    branchId: session.activeBranchId ?? undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Letters of Credit"
        description="Issue, amend, and track LC drawdowns (UCP 600 compliant)."
      >
        <Button variant="default" asChild>
          <Link href="/trade/lc/new">
            <Plus className="mr-2 h-4 w-4" />
            Issue LC
          </Link>
        </Button>
      </PageHeader>

      <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} empty="No letters of credit found." />
    </div>
  );
}
