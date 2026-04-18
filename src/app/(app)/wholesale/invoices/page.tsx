import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/shared/data-table';
import { Pill, type PillTone } from '@/components/shared/pill';
import { getSession } from '@/server/auth/session';
import { wholesaleService } from '@/server/services/wholesale.service';
import { formatCurrency } from '@/lib/money';

export const metadata = { title: 'Wholesale Invoices' };

const STATUS_TONE: Record<string, PillTone> = {
  CONFIRMED: 'blue',
  PARTIALLY_PAID: 'amber',
  PAID: 'green',
  OVERDUE: 'red',
  VOIDED: 'grey',
  PARTIALLY_RETURNED: 'amber',
  RETURNED: 'grey',
  DRAFT: 'grey',
};

const STATUSES = [
  'ALL',
  'CONFIRMED',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'PARTIALLY_RETURNED',
  'RETURNED',
  'VOIDED',
];

export default async function WholesaleInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const session = await getSession();
  const sp = await searchParams;
  const invoices = await wholesaleService.listInvoices(session, {
    status: sp.status && sp.status !== 'ALL' ? sp.status : undefined,
    search: sp.search || undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Wholesale invoices" description="All wholesale bills and credit balances.">
        <Button variant="dark" asChild>
          <Link href="/wholesale/new">New invoice</Link>
        </Button>
      </PageHeader>

      <Card className="p-4">
        <form className="grid grid-cols-1 md:grid-cols-[1fr_200px_auto] gap-3 items-end">
          <Input
            name="search"
            placeholder="Search by number or customer…"
            defaultValue={sp.search ?? ''}
          />
          <select
            name="status"
            defaultValue={sp.status ?? 'ALL'}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ').toLowerCase()}
              </option>
            ))}
          </select>
          <Button variant="outline" type="submit">
            Filter
          </Button>
        </form>
      </Card>

      <Card className="p-0">
        <div className="px-4 py-3 border-b text-sm font-medium">
          {invoices.length} invoice{invoices.length === 1 ? '' : 's'}
        </div>
        <DataTable
          rows={invoices}
          rowKey={(r) => r.id}
          empty="No invoices match."
          columns={[
            {
              key: 'number',
              header: 'Number',
              cell: (r) => (
                <Link
                  href={`/wholesale/invoices/${r.id}`}
                  className="text-blue-600 hover:underline tabular"
                >
                  {r.number}
                </Link>
              ),
            },
            {
              key: 'date',
              header: 'Date',
              cell: (r) => <span className="tabular">{r.invoiceDate.toISOString().slice(0, 10)}</span>,
            },
            {
              key: 'due',
              header: 'Due',
              cell: (r) =>
                r.dueDate ? (
                  <span className="tabular">{r.dueDate.toISOString().slice(0, 10)}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                ),
            },
            {
              key: 'customer',
              header: 'Customer',
              cell: (r) => `${r.customer.code} · ${r.customer.name}`,
            },
            {
              key: 'items',
              header: 'Items',
              align: 'right',
              cell: (r) => <span className="tabular">{r._count.items}</span>,
            },
            {
              key: 'total',
              header: 'Total',
              align: 'right',
              cell: (r) => (
                <span className="tabular font-medium">
                  {formatCurrency(r.grandTotal, r.currency)}
                </span>
              ),
            },
            {
              key: 'paid',
              header: 'Paid',
              align: 'right',
              cell: (r) => (
                <span className="tabular text-emerald-700">
                  {formatCurrency(r.paidTotal, r.currency)}
                </span>
              ),
            },
            {
              key: 'balance',
              header: 'Balance',
              align: 'right',
              cell: (r) =>
                r.balanceDue.gt(0) ? (
                  <span className="tabular text-red-600">
                    {formatCurrency(r.balanceDue, r.currency)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                ),
            },
            {
              key: 'status',
              header: 'Status',
              cell: (r) => (
                <Pill tone={STATUS_TONE[r.status] ?? 'grey'}>
                  {r.status.toLowerCase().replace('_', ' ')}
                </Pill>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
