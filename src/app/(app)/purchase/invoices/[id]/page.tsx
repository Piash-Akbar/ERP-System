import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/shared/pill';
import { DataTable } from '@/components/shared/data-table';
import { purchaseService } from '@/server/services/purchase.service';
import { getSession } from '@/server/auth/session';
import { NotFoundError } from '@/lib/errors';
import { formatCurrency } from '@/lib/money';
import type { CurrencyCode } from '@/lib/money';

const STATUS_TONE = {
  PENDING: 'amber',
  PARTIALLY_PAID: 'orange',
  PAID: 'green',
  CANCELLED: 'red',
} as const;

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  let invoice;
  try {
    invoice = await purchaseService.getInvoice(session, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
  const currency = invoice.currency as CurrencyCode;
  const outstanding = invoice.grandTotal.minus(invoice.paidAmount);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/purchase/invoices">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>
      <PageHeader
        title={invoice.number}
        description={`${invoice.supplier.name} · Due ${new Date(invoice.dueDate).toLocaleDateString()}`}
      >
        {outstanding.gt(0) && (
          <Button variant="dark" asChild>
            <Link href={`/suppliers/${invoice.supplierId}/pay?invoiceId=${invoice.id}`}>
              <CreditCard className="h-4 w-4" />
              Record Payment
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Status</p>
          <div className="mt-2">
            <Pill tone={STATUS_TONE[invoice.status as keyof typeof STATUS_TONE] ?? 'neutral'}>
              {invoice.status.replace('_', ' ').toLowerCase()}
            </Pill>
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Matching</p>
          <div className="mt-2">
            <Pill
              tone={
                invoice.matching === 'MATCHED' ? 'green' : invoice.matching === 'DISPUTED' ? 'red' : 'grey'
              }
            >
              {invoice.matching.toLowerCase()}
            </Pill>
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Grand total</p>
          <p className="mt-2 text-2xl font-semibold tabular">
            {formatCurrency(invoice.grandTotal, currency)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p
            className={`mt-2 text-2xl font-semibold tabular ${outstanding.gt(0) ? 'text-red-600' : 'text-emerald-600'}`}
          >
            {formatCurrency(outstanding, currency)}
          </p>
        </Card>
      </div>

      <Card className="p-0">
        <div className="px-4 py-3 border-b text-sm font-medium">Line items</div>
        <DataTable
          rows={invoice.items}
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
              key: 'qty',
              header: 'Qty',
              align: 'right',
              cell: (r) => <span className="tabular">{r.quantity.toString()} {r.unit}</span>,
            },
            {
              key: 'price',
              header: 'Unit price',
              align: 'right',
              cell: (r) => <span className="tabular">{formatCurrency(r.unitPrice, currency)}</span>,
            },
            {
              key: 'tax',
              header: 'Tax %',
              align: 'right',
              cell: (r) => <span className="tabular">{r.taxRate.toString()}%</span>,
            },
            {
              key: 'line',
              header: 'Line total',
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
            <p className="font-medium tabular">{formatCurrency(invoice.subtotal, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tax</p>
            <p className="font-medium tabular">{formatCurrency(invoice.taxTotal, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Discount</p>
            <p className="font-medium tabular text-red-600">
              − {formatCurrency(invoice.discountTotal, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Grand total</p>
            <p className="font-semibold tabular text-lg">
              {formatCurrency(invoice.grandTotal, currency)}
            </p>
          </div>
        </div>
      </Card>

      {invoice.payments.length > 0 && (
        <Card className="p-0">
          <div className="px-4 py-3 border-b text-sm font-medium">Payment history</div>
          <DataTable
            rows={invoice.payments}
            rowKey={(r) => r.id}
            empty=""
            columns={[
              {
                key: 'number',
                header: 'Payment #',
                cell: (r) => <span className="tabular">{r.number}</span>,
              },
              {
                key: 'date',
                header: 'Date',
                cell: (r) => new Date(r.paymentDate).toLocaleDateString(),
              },
              { key: 'method', header: 'Method', cell: (r) => r.method.replace('_', ' ').toLowerCase() },
              {
                key: 'amount',
                header: 'Amount',
                align: 'right',
                cell: (r) => (
                  <span className="tabular text-emerald-600">{formatCurrency(r.amount, currency)}</span>
                ),
              },
              { key: 'ref', header: 'Reference', cell: (r) => r.reference ?? '—' },
            ]}
          />
        </Card>
      )}

      {invoice.notes && (
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Notes</p>
            <p className="mt-1 text-sm whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
