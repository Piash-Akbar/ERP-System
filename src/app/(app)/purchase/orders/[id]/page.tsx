import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Check, X, PackagePlus, FileText } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/shared/pill';
import { DataTable } from '@/components/shared/data-table';
import { StepIndicator, type StepState } from '@/components/shared/step-indicator';
import { purchaseService } from '@/server/services/purchase.service';
import {
  approvePurchaseOrderAction,
  cancelPurchaseOrderAction,
} from '@/server/actions/purchase';
import { getSession } from '@/server/auth/session';
import { NotFoundError } from '@/lib/errors';
import { formatCurrency } from '@/lib/money';
import type { CurrencyCode } from '@/lib/money';

const STATUS_TONE = {
  DRAFT: 'blue',
  PENDING: 'amber',
  APPROVED: 'green',
  PARTIALLY_RECEIVED: 'orange',
  COMPLETED: 'green',
  CANCELLED: 'red',
} as const;

function stepState(status: string, target: string): StepState {
  const order = ['PR', 'PO', 'GRN', 'INVOICE', 'PAYMENT'];
  const idx = order.indexOf(target);
  if (status === 'CANCELLED') return idx <= 1 ? 'completed' : 'pending';
  if (status === 'COMPLETED') return idx <= 2 ? 'completed' : idx === 3 ? 'active' : 'pending';
  if (status === 'PARTIALLY_RECEIVED') return idx <= 1 ? 'completed' : idx === 2 ? 'active' : 'pending';
  if (status === 'APPROVED') return idx <= 1 ? 'completed' : idx === 2 ? 'active' : 'pending';
  return idx === 0 ? 'completed' : idx === 1 ? 'active' : 'pending';
}

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  let po;
  try {
    po = await purchaseService.getPurchaseOrder(session, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
  const currency = po.currency as CurrencyCode;
  const canApprove = po.status === 'PENDING' || po.status === 'DRAFT';
  const canReceive = po.status === 'APPROVED' || po.status === 'PARTIALLY_RECEIVED';
  const canInvoice = ['APPROVED', 'PARTIALLY_RECEIVED', 'COMPLETED'].includes(po.status);
  const canCancel = !['COMPLETED', 'CANCELLED'].includes(po.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/purchase/orders">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>
      <PageHeader
        title={po.number}
        description={`${po.supplier.name} (${po.supplier.code}) · Delivery ${new Date(po.deliveryDate).toLocaleDateString()}`}
      >
        {canApprove && (
          <form action={approvePurchaseOrderAction}>
            <input type="hidden" name="id" value={po.id} />
            <Button type="submit" variant="dark">
              <Check className="h-4 w-4" />
              Approve
            </Button>
          </form>
        )}
        {canReceive && (
          <Button variant="outline" asChild>
            <Link href={`/purchase/grn/new?purchaseOrderId=${po.id}`}>
              <PackagePlus className="h-4 w-4" />
              Receive Goods
            </Link>
          </Button>
        )}
        {canInvoice && (
          <Button variant="outline" asChild>
            <Link href={`/purchase/invoices/new?purchaseOrderId=${po.id}`}>
              <FileText className="h-4 w-4" />
              Record Invoice
            </Link>
          </Button>
        )}
        {canCancel && (
          <form action={cancelPurchaseOrderAction}>
            <input type="hidden" name="id" value={po.id} />
            <Button type="submit" variant="outline">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </form>
        )}
      </PageHeader>

      <StepIndicator
        steps={[
          { key: 'pr', label: 'PR', state: stepState(po.status, 'PR') },
          { key: 'po', label: 'PO', state: stepState(po.status, 'PO') },
          { key: 'grn', label: 'GRN', state: stepState(po.status, 'GRN') },
          { key: 'invoice', label: 'Invoice', state: stepState(po.status, 'INVOICE') },
          { key: 'payment', label: 'Payment', state: stepState(po.status, 'PAYMENT') },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Status</p>
          <div className="mt-2">
            <Pill tone={STATUS_TONE[po.status as keyof typeof STATUS_TONE] ?? 'neutral'}>
              {po.status.replace('_', ' ').toLowerCase()}
            </Pill>
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Grand total</p>
          <p className="mt-2 text-2xl font-semibold tabular">
            {formatCurrency(po.grandTotal, currency)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Order date</p>
          <p className="mt-2 text-base font-semibold">
            {new Date(po.orderDate).toLocaleDateString()}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Branch</p>
          <p className="mt-2 text-base font-semibold">{po.branch.name}</p>
        </Card>
      </div>

      <Card className="p-0">
        <div className="px-4 py-3 border-b text-sm font-medium">Line items</div>
        <DataTable
          rows={po.items}
          rowKey={(r) => r.id}
          empty="No items"
          columns={[
            {
              key: 'product',
              header: 'Product',
              cell: (r) => (
                <div>
                  <p className="font-medium">{r.product.name}</p>
                  <p className="text-xs text-muted-foreground tabular">{r.product.sku}</p>
                </div>
              ),
            },
            {
              key: 'ordered',
              header: 'Ordered',
              align: 'right',
              cell: (r) => <span className="tabular">{r.orderedQty.toString()} {r.unit}</span>,
            },
            {
              key: 'received',
              header: 'Received',
              align: 'right',
              cell: (r) => (
                <span
                  className={`tabular ${r.receivedQty.gte(r.orderedQty) ? 'text-emerald-600' : r.receivedQty.gt(0) ? 'text-orange-600' : 'text-muted-foreground'}`}
                >
                  {r.receivedQty.toString()}
                </span>
              ),
            },
            {
              key: 'price',
              header: 'Unit Price',
              align: 'right',
              cell: (r) => (
                <span className="tabular">{formatCurrency(r.unitPrice, currency)}</span>
              ),
            },
            {
              key: 'line',
              header: 'Line Total',
              align: 'right',
              cell: (r) => (
                <span className="tabular font-medium">{formatCurrency(r.lineTotal, currency)}</span>
              ),
            },
          ]}
        />
        <div className="border-t px-4 py-3 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Subtotal</p>
            <p className="font-medium tabular">{formatCurrency(po.subtotal, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Discount</p>
            <p className="font-medium tabular text-red-600">
              − {formatCurrency(po.discountTotal, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tax</p>
            <p className="font-medium tabular">{formatCurrency(po.taxTotal, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Grand total</p>
            <p className="font-semibold tabular text-lg">{formatCurrency(po.grandTotal, currency)}</p>
          </div>
        </div>
      </Card>

      {po.grns.length > 0 && (
        <Card className="p-0">
          <div className="px-4 py-3 border-b text-sm font-medium">Goods receiving history</div>
          <DataTable
            rows={po.grns}
            rowKey={(r) => r.id}
            empty="No GRNs yet"
            columns={[
              {
                key: 'number',
                header: 'GRN #',
                cell: (r) => (
                  <Link
                    href={`/purchase/grn/${r.id}`}
                    className="text-blue-600 hover:underline tabular"
                  >
                    {r.number}
                  </Link>
                ),
              },
              {
                key: 'date',
                header: 'Received',
                cell: (r) => new Date(r.receivedDate).toLocaleDateString(),
              },
              {
                key: 'status',
                header: 'Status',
                cell: (r) => (
                  <Pill tone={r.status === 'COMPLETED' ? 'green' : r.status === 'CANCELLED' ? 'red' : 'amber'}>
                    {r.status.toLowerCase()}
                  </Pill>
                ),
              },
            ]}
          />
        </Card>
      )}

      {po.invoices.length > 0 && (
        <Card className="p-0">
          <div className="px-4 py-3 border-b text-sm font-medium">Invoices</div>
          <DataTable
            rows={po.invoices}
            rowKey={(r) => r.id}
            empty=""
            columns={[
              {
                key: 'number',
                header: 'Invoice #',
                cell: (r) => (
                  <Link
                    href={`/purchase/invoices/${r.id}`}
                    className="text-blue-600 hover:underline tabular"
                  >
                    {r.number}
                  </Link>
                ),
              },
              {
                key: 'total',
                header: 'Total',
                align: 'right',
                cell: (r) => <span className="tabular">{formatCurrency(r.grandTotal, currency)}</span>,
              },
              {
                key: 'paid',
                header: 'Paid',
                align: 'right',
                cell: (r) => (
                  <span className="tabular text-emerald-600">{formatCurrency(r.paidAmount, currency)}</span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                cell: (r) => (
                  <Pill
                    tone={
                      r.status === 'PAID'
                        ? 'green'
                        : r.status === 'PARTIALLY_PAID'
                          ? 'orange'
                          : r.status === 'CANCELLED'
                            ? 'red'
                            : 'amber'
                    }
                  >
                    {r.status.replace('_', ' ').toLowerCase()}
                  </Pill>
                ),
              },
            ]}
          />
        </Card>
      )}

      {po.notes && (
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Notes</p>
            <p className="mt-1 text-sm whitespace-pre-wrap">{po.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
