import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Check, X, ShoppingCart } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/shared/pill';
import { DataTable } from '@/components/shared/data-table';
import { purchaseService } from '@/server/services/purchase.service';
import { decideRequisitionAction } from '@/server/actions/purchase';
import { getSession } from '@/server/auth/session';
import { NotFoundError } from '@/lib/errors';

const PRIORITY_TONE = {
  URGENT: 'red',
  HIGH: 'red',
  MEDIUM: 'orange',
  LOW: 'blue',
} as const;

const STATUS_TONE = {
  PENDING: 'amber',
  APPROVED: 'green',
  REJECTED: 'red',
  DRAFT: 'blue',
  CANCELLED: 'grey',
  CLOSED: 'grey',
} as const;

export default async function RequisitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  let pr;
  try {
    pr = await purchaseService.getRequisition(session, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
  const canApprove = pr.status === 'PENDING' || pr.status === 'DRAFT';
  const canConvert = pr.status === 'APPROVED' && pr.purchaseOrders.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/purchase/requisitions">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>
      <PageHeader
        title={pr.number}
        description={`${pr.department} · requested by ${pr.requestedBy}`}
      >
        {canApprove && (
          <>
            <form action={decideRequisitionAction}>
              <input type="hidden" name="id" value={pr.id} />
              <input type="hidden" name="decision" value="REJECT" />
              <Button type="submit" variant="outline">
                <X className="h-4 w-4" />
                Reject
              </Button>
            </form>
            <form action={decideRequisitionAction}>
              <input type="hidden" name="id" value={pr.id} />
              <input type="hidden" name="decision" value="APPROVE" />
              <Button type="submit" variant="dark">
                <Check className="h-4 w-4" />
                Approve
              </Button>
            </form>
          </>
        )}
        {canConvert && (
          <Button variant="dark" asChild>
            <Link href={`/purchase/orders/new?requisitionId=${pr.id}`}>
              <ShoppingCart className="h-4 w-4" />
              Convert to PO
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Status</p>
          <div className="mt-2">
            <Pill tone={STATUS_TONE[pr.status as keyof typeof STATUS_TONE] ?? 'neutral'}>
              {pr.status.toLowerCase()}
            </Pill>
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Priority</p>
          <div className="mt-2">
            <Pill tone={PRIORITY_TONE[pr.priority as keyof typeof PRIORITY_TONE] ?? 'neutral'}>
              {pr.priority.toLowerCase()}
            </Pill>
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Required Date</p>
          <p className="mt-2 text-lg font-semibold">
            {new Date(pr.requiredDate).toLocaleDateString()}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Branch</p>
          <p className="mt-2 text-lg font-semibold">{pr.branch.name}</p>
        </Card>
      </div>

      {pr.status === 'REJECTED' && pr.rejectedReason && (
        <Card className="p-5 border-red-100 bg-red-50 text-red-900">
          <p className="text-sm font-medium">Rejection reason</p>
          <p className="text-sm mt-1">{pr.rejectedReason}</p>
        </Card>
      )}

      <Card className="p-0">
        <div className="px-4 py-3 border-b text-sm font-medium">Items ({pr.items.length})</div>
        <DataTable
          rows={pr.items}
          rowKey={(r) => r.id}
          empty="No items"
          columns={[
            {
              key: 'product',
              header: 'Product',
              cell: (r) => (
                <div>
                  <p className="font-medium">{r.product?.name ?? r.productName}</p>
                  {r.product?.sku && <p className="text-xs text-muted-foreground tabular">{r.product.sku}</p>}
                </div>
              ),
            },
            { key: 'unit', header: 'Unit', cell: (r) => r.unit },
            {
              key: 'qty',
              header: 'Quantity',
              align: 'right',
              cell: (r) => <span className="tabular">{r.quantity.toString()}</span>,
            },
            {
              key: 'price',
              header: 'Est. Price',
              align: 'right',
              cell: (r) => <span className="tabular">{r.estimatedPrice.toString()}</span>,
            },
            { key: 'note', header: 'Note', cell: (r) => r.note ?? '—' },
          ]}
        />
      </Card>

      {pr.notes && (
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Notes</p>
            <p className="mt-1 text-sm whitespace-pre-wrap">{pr.notes}</p>
          </CardContent>
        </Card>
      )}

      {pr.purchaseOrders.length > 0 && (
        <Card className="p-5">
          <p className="text-sm font-medium">Linked Purchase Orders</p>
          <ul className="mt-2 space-y-1 text-sm">
            {pr.purchaseOrders.map((po) => (
              <li key={po.id}>
                <Link
                  href={`/purchase/orders/${po.id}`}
                  className="text-blue-600 hover:underline tabular"
                >
                  {po.number}
                </Link>
                <span className="ml-2 text-muted-foreground">({po.status.toLowerCase()})</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
