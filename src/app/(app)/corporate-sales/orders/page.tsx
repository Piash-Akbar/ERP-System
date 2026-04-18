import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/shared/data-table';
import { Pill, type PillTone } from '@/components/shared/pill';
import { getSession } from '@/server/auth/session';
import { corporateService } from '@/server/services/corporate-sales.service';
import { formatCurrency } from '@/lib/money';

export const metadata = { title: 'Corporate Orders' };

const STATUS_TONE: Record<string, PillTone> = {
  DRAFT: 'grey',
  CONFIRMED: 'blue',
  PARTIALLY_DELIVERED: 'amber',
  DELIVERED: 'green',
  INVOICED: 'black',
  CLOSED: 'grey',
  CANCELED: 'red',
};

const STATUSES = [
  'ALL',
  'CONFIRMED',
  'PARTIALLY_DELIVERED',
  'DELIVERED',
  'INVOICED',
  'CLOSED',
  'CANCELED',
];

export default async function CorporateOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const session = await getSession();
  const sp = await searchParams;
  const orders = await corporateService.listOrders(session, {
    status: sp.status && sp.status !== 'ALL' ? sp.status : undefined,
    search: sp.search || undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Corporate sales orders and fulfilment status.">
        <Button variant="dark" asChild>
          <Link href="/corporate-sales/orders/new">New order</Link>
        </Button>
      </PageHeader>

      <Card className="p-4">
        <form className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3 items-end">
          <Input name="search" placeholder="Search…" defaultValue={sp.search ?? ''} />
          <select
            name="status"
            defaultValue={sp.status ?? 'ALL'}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.toLowerCase().replace('_', ' ')}
              </option>
            ))}
          </select>
          <Button variant="outline" type="submit">Filter</Button>
        </form>
      </Card>

      <Card className="p-0">
        <div className="px-4 py-3 border-b text-sm font-medium">
          {orders.length} order{orders.length === 1 ? '' : 's'}
        </div>
        <DataTable
          rows={orders}
          rowKey={(r) => r.id}
          empty="No orders yet."
          columns={[
            {
              key: 'number',
              header: 'Number',
              cell: (r) => (
                <Link
                  href={`/corporate-sales/orders/${r.id}`}
                  className="text-blue-600 hover:underline tabular"
                >
                  {r.number}
                </Link>
              ),
            },
            { key: 'date', header: 'Date', cell: (r) => <span className="tabular">{r.orderDate.toISOString().slice(0, 10)}</span> },
            { key: 'expected', header: 'Expected', cell: (r) => r.expectedDate ? <span className="tabular">{r.expectedDate.toISOString().slice(0, 10)}</span> : <span className="text-muted-foreground">—</span> },
            { key: 'customer', header: 'Customer', cell: (r) => `${r.customer.code} · ${r.customer.name}` },
            { key: 'wh', header: 'Warehouse', cell: (r) => r.warehouse.name },
            { key: 'items', header: 'Items', align: 'right', cell: (r) => <span className="tabular">{r._count.items}</span> },
            { key: 'deliv', header: 'Deliveries', align: 'right', cell: (r) => <span className="tabular">{r._count.deliveries}</span> },
            { key: 'total', header: 'Total', align: 'right', cell: (r) => <span className="tabular font-medium">{formatCurrency(r.grandTotal, r.currency)}</span> },
            { key: 'status', header: 'Status', cell: (r) => <Pill tone={STATUS_TONE[r.status] ?? 'grey'}>{r.status.toLowerCase().replace('_', ' ')}</Pill> },
          ]}
        />
      </Card>
    </div>
  );
}
