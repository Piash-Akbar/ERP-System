import Link from 'next/link';
import { Plus, Eye } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/shared/pill';
import { DataTable } from '@/components/shared/data-table';
import { StepIndicator } from '@/components/shared/step-indicator';
import { purchaseService } from '@/server/services/purchase.service';
import { getSession } from '@/server/auth/session';
import { formatCurrency } from '@/lib/money';
import type { CurrencyCode } from '@/lib/money';

export const metadata = { title: 'Purchase Orders' };

const STATUS_TONE = {
  DRAFT: 'blue',
  PENDING: 'amber',
  APPROVED: 'green',
  PARTIALLY_RECEIVED: 'orange',
  COMPLETED: 'green',
  CANCELLED: 'red',
} as const;

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSession();
  const sp = await searchParams;
  const orders = await purchaseService.listPurchaseOrders(session, {
    status: sp.status && sp.status !== 'ALL' ? sp.status : undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Create and manage purchase orders"
      >
        <Button variant="dark" asChild>
          <Link href="/purchase/orders/new">
            <Plus className="h-4 w-4" />
            Create PO
          </Link>
        </Button>
      </PageHeader>

      <StepIndicator
        steps={[
          { key: 'pr', label: 'PR Approved', state: 'completed' },
          { key: 'po', label: 'Create PO', state: 'active' },
          { key: 'grn', label: 'GRN', state: 'pending' },
          { key: 'invoice', label: 'Invoice', state: 'pending' },
          { key: 'payment', label: 'Payment', state: 'pending' },
        ]}
      />

      <Card className="p-4">
        <form className="flex items-end gap-3">
          <select
            name="status"
            defaultValue={sp.status ?? 'ALL'}
            className="flex h-9 w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="PARTIALLY_RECEIVED">Partially received</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <Button type="submit" variant="outline">
            Filter
          </Button>
        </form>
      </Card>

      <Card className="p-0">
        <div className="px-4 py-3 border-b text-sm font-medium">
          All Purchase Orders ({orders.length})
        </div>
        <DataTable
          rows={orders}
          rowKey={(r) => r.id}
          empty="No purchase orders yet."
          columns={[
            {
              key: 'number',
              header: 'PO ID',
              cell: (r) => (
                <Link
                  href={`/purchase/orders/${r.id}`}
                  className="text-blue-600 hover:underline tabular"
                >
                  {r.number}
                </Link>
              ),
            },
            {
              key: 'supplier',
              header: 'Supplier',
              cell: (r) => (
                <div>
                  <p>{r.supplier.name}</p>
                  <p className="text-xs text-muted-foreground tabular">{r.supplier.code}</p>
                </div>
              ),
            },
            {
              key: 'pr',
              header: 'PR Reference',
              cell: (r) =>
                r.requisition ? (
                  <Link
                    href={`/purchase/requisitions/${r.requisition.id}`}
                    className="text-blue-600 hover:underline tabular"
                  >
                    {r.requisition.number}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">—</span>
                ),
            },
            { key: 'items', header: 'Items', cell: (r) => `${r.items.length} items` },
            {
              key: 'total',
              header: 'Total Amount',
              align: 'right',
              cell: (r) => (
                <span className="tabular">
                  {formatCurrency(r.grandTotal, r.currency as CurrencyCode)}
                </span>
              ),
            },
            {
              key: 'deliveryDate',
              header: 'Delivery Date',
              cell: (r) => new Date(r.deliveryDate).toLocaleDateString(),
            },
            {
              key: 'status',
              header: 'Status',
              cell: (r) => (
                <Pill tone={STATUS_TONE[r.status as keyof typeof STATUS_TONE] ?? 'neutral'}>
                  {r.status.replace('_', ' ').toLowerCase()}
                </Pill>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              cell: (r) => (
                <Link
                  href={`/purchase/orders/${r.id}`}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Eye className="h-4 w-4" />
                </Link>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
