import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/data-table';
import { Pill, type PillTone } from '@/components/shared/pill';
import { getSession } from '@/server/auth/session';
import { wholesaleService } from '@/server/services/wholesale.service';
import { formatCurrency, type CurrencyCode } from '@/lib/money';
import { NotFoundError } from '@/lib/errors';
import { PaymentForm } from './payment-form';
import { ReturnForm } from './return-form';

export const metadata = { title: 'Wholesale Invoice' };

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

export default async function WholesaleInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  const { id } = await params;
  let invoice;
  try {
    invoice = await wholesaleService.getInvoice(session, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }

  const currency = invoice.currency as CurrencyCode;
  const closed =
    invoice.status === 'VOIDED' || invoice.status === 'RETURNED' || invoice.status === 'PAID';
  const canPay = Number(invoice.balanceDue) > 0 && invoice.status !== 'VOIDED';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Invoice ${invoice.number}`}
        description={`${invoice.customer.code} · ${invoice.customer.name}`}
      >
        <Button variant="outline" asChild>
          <Link href="/wholesale/invoices">
            <ArrowLeft className="h-4 w-4" /> All invoices
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <Pill tone={STATUS_TONE[invoice.status] ?? 'grey'}>
                  {invoice.status.toLowerCase().replace('_', ' ')}
                </Pill>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Invoice date</div>
                <div className="tabular">{invoice.invoiceDate.toISOString().slice(0, 10)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Due</div>
                <div className="tabular">
                  {invoice.dueDate ? invoice.dueDate.toISOString().slice(0, 10) : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Warehouse</div>
                <div>{invoice.warehouse.name}</div>
              </div>
            </div>
            {invoice.notes && (
              <div className="text-sm border-t pt-3 text-muted-foreground">{invoice.notes}</div>
            )}
          </Card>

          <Card className="p-0">
            <div className="px-4 py-3 border-b text-sm font-medium">Line items</div>
            <DataTable
              rows={invoice.items}
              rowKey={(r) => r.id}
              empty="No items."
              columns={[
                {
                  key: 'sku',
                  header: 'Product',
                  cell: (r) => (
                    <div>
                      <div className="font-medium">{r.product.name}</div>
                      <div className="text-xs text-muted-foreground">{r.product.sku}</div>
                    </div>
                  ),
                },
                {
                  key: 'qty',
                  header: 'Qty',
                  align: 'right',
                  cell: (r) => <span className="tabular">{r.quantity.toString()}</span>,
                },
                {
                  key: 'returned',
                  header: 'Returned',
                  align: 'right',
                  cell: (r) =>
                    r.returnedQty.gt(0) ? (
                      <span className="tabular text-amber-700">{r.returnedQty.toString()}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    ),
                },
                {
                  key: 'price',
                  header: 'Price',
                  align: 'right',
                  cell: (r) => <span className="tabular">{formatCurrency(r.unitPrice, currency)}</span>,
                },
                {
                  key: 'disc',
                  header: 'Disc %',
                  align: 'right',
                  cell: (r) => <span className="tabular">{r.discountRate.toString()}</span>,
                },
                {
                  key: 'tax',
                  header: 'Tax %',
                  align: 'right',
                  cell: (r) => <span className="tabular">{r.taxRate.toString()}</span>,
                },
                {
                  key: 'total',
                  header: 'Line total',
                  align: 'right',
                  cell: (r) => (
                    <span className="tabular font-medium">
                      {formatCurrency(r.lineTotal, currency)}
                    </span>
                  ),
                },
              ]}
            />
            <div className="border-t p-4 grid grid-cols-2 gap-3 text-sm max-w-md ml-auto">
              <div className="text-muted-foreground">Subtotal</div>
              <div className="text-right tabular">{formatCurrency(invoice.subtotal, currency)}</div>
              <div className="text-muted-foreground">Discount</div>
              <div className="text-right tabular">
                −{formatCurrency(invoice.discountTotal, currency)}
              </div>
              <div className="text-muted-foreground">Tax</div>
              <div className="text-right tabular">{formatCurrency(invoice.taxTotal, currency)}</div>
              <div className="font-semibold text-base border-t pt-2">Grand total</div>
              <div className="text-right font-semibold text-base tabular border-t pt-2">
                {formatCurrency(invoice.grandTotal, currency)}
              </div>
              <div className="text-muted-foreground">Paid</div>
              <div className="text-right tabular text-emerald-700">
                {formatCurrency(invoice.paidTotal, currency)}
              </div>
              <div className="font-medium">Balance due</div>
              <div className="text-right font-medium tabular text-red-600">
                {formatCurrency(invoice.balanceDue, currency)}
              </div>
            </div>
          </Card>

          <Card className="p-0">
            <div className="px-4 py-3 border-b text-sm font-medium">
              Payments ({invoice.payments.length})
            </div>
            <DataTable
              rows={invoice.payments}
              rowKey={(r) => r.id}
              empty="No payments yet."
              columns={[
                {
                  key: 'paidAt',
                  header: 'Date',
                  cell: (r) => <span className="tabular">{r.paidAt.toISOString().slice(0, 10)}</span>,
                },
                { key: 'method', header: 'Method', cell: (r) => r.method.replace('_', ' ') },
                {
                  key: 'reference',
                  header: 'Reference',
                  cell: (r) => r.reference ?? <span className="text-muted-foreground">—</span>,
                },
                {
                  key: 'amount',
                  header: 'Amount',
                  align: 'right',
                  cell: (r) => (
                    <span className="tabular font-medium">
                      {formatCurrency(r.amount, currency)}
                    </span>
                  ),
                },
              ]}
            />
          </Card>

          {invoice.returns.length > 0 && (
            <Card className="p-0">
              <div className="px-4 py-3 border-b text-sm font-medium">
                Returns ({invoice.returns.length})
              </div>
              <DataTable
                rows={invoice.returns}
                rowKey={(r) => r.id}
                empty="No returns."
                columns={[
                  {
                    key: 'number',
                    header: 'Number',
                    cell: (r) => <span className="tabular">{r.number}</span>,
                  },
                  {
                    key: 'date',
                    header: 'Date',
                    cell: (r) => (
                      <span className="tabular">{r.returnDate.toISOString().slice(0, 10)}</span>
                    ),
                  },
                  { key: 'reason', header: 'Reason', cell: (r) => r.reason ?? '—' },
                  {
                    key: 'amount',
                    header: 'Refund',
                    align: 'right',
                    cell: (r) => (
                      <span className="tabular">{formatCurrency(r.refundAmount, currency)}</span>
                    ),
                  },
                ]}
              />
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {canPay && (
            <PaymentForm
              invoiceId={invoice.id}
              balanceDue={Number(invoice.balanceDue)}
              currency={currency}
            />
          )}
          {!closed && (
            <ReturnForm
              invoiceId={invoice.id}
              currency={currency}
              items={invoice.items.map((i) => ({
                id: i.id,
                name: i.product.name,
                sku: i.product.sku,
                quantity: Number(i.quantity),
                returnedQty: Number(i.returnedQty),
                unitPrice: Number(i.unitPrice),
              }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
