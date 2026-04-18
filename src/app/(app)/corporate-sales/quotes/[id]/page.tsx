import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/data-table';
import { Pill, type PillTone } from '@/components/shared/pill';
import { getSession } from '@/server/auth/session';
import { corporateService } from '@/server/services/corporate-sales.service';
import { prisma } from '@/server/db';
import { formatCurrency, type CurrencyCode } from '@/lib/money';
import { NotFoundError } from '@/lib/errors';
import { QuoteActions } from './actions';

export const metadata = { title: 'Quote' };

const TONE: Record<string, PillTone> = {
  DRAFT: 'grey',
  SENT: 'blue',
  ACCEPTED: 'green',
  REJECTED: 'red',
  EXPIRED: 'amber',
  CONVERTED: 'black',
};

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  const { id } = await params;
  let quote;
  try {
    quote = await corporateService.getQuote(session, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
  const currency = quote.currency as CurrencyCode;
  const warehouses = await prisma.warehouse.findMany({
    where: { branchId: quote.branchId, isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Quote ${quote.number}`}
        description={`${quote.customer.code} · ${quote.customer.name}`}
      >
        <Button variant="outline" asChild>
          <Link href="/corporate-sales/quotes">
            <ArrowLeft className="h-4 w-4" /> All quotes
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <Pill tone={TONE[quote.status] ?? 'grey'}>{quote.status.toLowerCase()}</Pill>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Quote date</div>
                <div className="tabular">{quote.quoteDate.toISOString().slice(0, 10)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Valid until</div>
                <div className="tabular">
                  {quote.validUntil ? quote.validUntil.toISOString().slice(0, 10) : '—'}
                </div>
              </div>
              {quote.orders.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground">Converted to</div>
                  <div className="flex gap-2">
                    {quote.orders.map((o) => (
                      <Link
                        key={o.id}
                        href={`/corporate-sales/orders/${o.id}`}
                        className="text-blue-600 hover:underline tabular"
                      >
                        {o.number}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {quote.notes && (
              <div className="text-sm border-t pt-3 text-muted-foreground mt-4">{quote.notes}</div>
            )}
            {quote.rejectReason && (
              <div className="text-sm text-red-600 border-t pt-3 mt-4">
                Rejected: {quote.rejectReason}
              </div>
            )}
          </Card>

          <Card className="p-0">
            <div className="px-4 py-3 border-b text-sm font-medium">Line items</div>
            <DataTable
              rows={quote.items}
              rowKey={(r) => r.id}
              empty="—"
              columns={[
                {
                  key: 'product',
                  header: 'Product',
                  cell: (r) => (
                    <div>
                      <div className="font-medium">{r.product.name}</div>
                      <div className="text-xs text-muted-foreground">{r.product.sku}</div>
                    </div>
                  ),
                },
                { key: 'qty', header: 'Qty', align: 'right', cell: (r) => <span className="tabular">{r.quantity.toString()}</span> },
                { key: 'price', header: 'Price', align: 'right', cell: (r) => <span className="tabular">{formatCurrency(r.unitPrice, currency)}</span> },
                { key: 'disc', header: 'Disc %', align: 'right', cell: (r) => <span className="tabular">{r.discountRate.toString()}</span> },
                { key: 'tax', header: 'Tax %', align: 'right', cell: (r) => <span className="tabular">{r.taxRate.toString()}</span> },
                { key: 'total', header: 'Line total', align: 'right', cell: (r) => <span className="tabular font-medium">{formatCurrency(r.lineTotal, currency)}</span> },
              ]}
            />
            <div className="border-t p-4 grid grid-cols-2 gap-3 text-sm max-w-sm ml-auto">
              <div className="text-muted-foreground">Subtotal</div>
              <div className="text-right tabular">{formatCurrency(quote.subtotal, currency)}</div>
              <div className="text-muted-foreground">Discount</div>
              <div className="text-right tabular">−{formatCurrency(quote.discountTotal, currency)}</div>
              <div className="text-muted-foreground">Tax</div>
              <div className="text-right tabular">{formatCurrency(quote.taxTotal, currency)}</div>
              <div className="font-semibold border-t pt-2">Grand total</div>
              <div className="text-right font-semibold tabular border-t pt-2">
                {formatCurrency(quote.grandTotal, currency)}
              </div>
            </div>
          </Card>
        </div>

        <div>
          <QuoteActions
            quoteId={quote.id}
            status={quote.status}
            warehouses={warehouses}
          />
        </div>
      </div>
    </div>
  );
}
