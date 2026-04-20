import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type DataTableColumn } from '@/components/shared/data-table';
import { Pill, type PillTone } from '@/components/shared/pill';
import { getSession } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { authorize } from '@/server/auth/authorize';

export const metadata = { title: 'Shipments' };

const STATUS_TONE: Record<string, PillTone> = {
  PENDING: 'grey', BOOKING_CONFIRMED: 'blue', IN_TRANSIT: 'blue',
  AT_PORT: 'amber', CUSTOMS_CLEARANCE: 'amber', DELIVERED: 'green', CANCELLED: 'red',
};

type Row = Awaited<ReturnType<typeof fetchShipments>>[number];

async function fetchShipments(branchId?: string) {
  return prisma.tradeShipment.findMany({
    where: { tradeOrder: { branchId } },
    include: { tradeOrder: { select: { id: true, number: true, type: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

const columns: DataTableColumn<Row>[] = [
  {
    key: 'order', header: 'Trade Order',
    cell: (r) => (
      <Link href={`/trade/orders/${r.tradeOrder.id}`} className="text-primary hover:underline font-mono text-sm">
        {r.tradeOrder.number}
      </Link>
    ),
  },
  { key: 'seq', header: '#', cell: (r) => r.sequence },
  { key: 'vessel', header: 'Vessel', cell: (r) => r.vesselName ?? '—' },
  { key: 'bl', header: 'BL Number', cell: (r) => r.blNumber ? <span className="font-mono text-xs">{r.blNumber}</span> : '—' },
  { key: 'etd', header: 'ETD', cell: (r) => r.etd ? new Date(r.etd).toLocaleDateString() : '—' },
  { key: 'eta', header: 'ETA', cell: (r) => r.eta ? new Date(r.eta).toLocaleDateString() : '—' },
  {
    key: 'status', header: 'Status',
    cell: (r) => <Pill tone={STATUS_TONE[r.status] ?? 'grey'}>{r.status.replace(/_/g, ' ')}</Pill>,
  },
];

export default async function ShipmentsPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  await authorize(session, 'trade:read');

  const rows = await fetchShipments(session.activeBranchId ?? undefined);

  return (
    <div className="space-y-6">
      <PageHeader title="Shipments" description="All shipment records across trade orders." />
      <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} empty="No shipments recorded." />
    </div>
  );
}
