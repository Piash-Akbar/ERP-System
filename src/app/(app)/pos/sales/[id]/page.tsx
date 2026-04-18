import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill, type PillTone } from '@/components/shared/pill';
import { DataTable } from '@/components/shared/data-table';
import { getSession } from '@/server/auth/session';
import { posService } from '@/server/services/pos.service';
import { formatCurrency } from '@/lib/money';
import { RefundForm } from './refund-form';

const STATUS_TONE: Record<string, PillTone> = {
  COMPLETED: 'green',
  VOIDED: 'red',
  REFUNDED: 'amber',
  PARTIALLY_REFUNDED: 'amber',
};

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const { id } = await params;
  let sale;
  try {
    sale = await posService.getSale(session, id);
  } catch {
    notFound();
  }

  const canRefund =
    sale.status !== 'VOIDED' &&
    sale.status !== 'REFUNDED' &&
    session?.permissions.includes('pos:refund');

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Sale ${sale.number}`}
        description={`${sale.warehouse.name} · ${sale.saleDate.toLocaleString()}`}
      >
        <Pill tone={STATUS_TONE[sale.status] ?? 'grey'}>{sale.status.toLowerCase().replace('_', ' ')}</Pill>
        <Button variant="outline" asChild>
          <Link href="/pos/sales">Back</Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        <div className="space-y-4">
          <Card className="p-0">
            <div className="px-4 py-3 border-b text-sm font-medium">Line items</div>
            <DataTable
              rows={sale.items}
              rowKey={(r) => r.id}
              empty="—"
              columns={[
                { key: 'sku', header: 'SKU', cell: (r) => <span className="tabular">{r.product.sku}</span> },
                { key: 'name', header: 'Name', cell: (r) => r.product.name },
                {
                  key: 'qty',
                  header: 'Qty',
                  align: 'right',
                  cell: (r) => (
                    <span className="tabular">
                      {r.quantity.toString()}
                      {r.returnedQty.gt(0) && (
                        <span className="text-xs text-muted-foreground ml-1">(−{r.returnedQty.toString()})</span>
                      )}
                    </span>
                  ),
                },
                { key: 'price', header: 'Price', align: 'right', cell: (r) => <span className="tabular">{formatCurrency(r.unitPrice, sale.currency)}</span> },
                { key: 'disc', header: 'Disc %', align: 'right', cell: (r) => <span className="tabular">{r.discountRate.toString()}</span> },
                { key: 'tax', header: 'Tax %', align: 'right', cell: (r) => <span className="tabular">{r.taxRate.toString()}</span> },
                { key: 'total', header: 'Total', align: 'right', cell: (r) => <span className="tabular font-medium">{formatCurrency(r.lineTotal, sale.currency)}</span> },
              ]}
            />
          </Card>

          {sale.returns.length > 0 && (
            <Card className="p-0">
              <div className="px-4 py-3 border-b text-sm font-medium">Refunds</div>
              <DataTable
                rows={sale.returns}
                rowKey={(r) => r.id}
                empty="—"
                columns={[
                  { key: 'number', header: 'Number', cell: (r) => <span className="tabular">{r.number}</span> },
                  { key: 'date', header: 'Date', cell: (r) => r.returnDate.toISOString().slice(0, 16).replace('T', ' ') },
                  { key: 'items', header: 'Lines', align: 'right', cell: (r) => r.items.length },
                  { key: 'method', header: 'Method', cell: (r) => r.refundMethod.toLowerCase().replace('_', ' ') },
                  { key: 'amount', header: 'Refund', align: 'right', cell: (r) => <span className="tabular">{formatCurrency(r.refundAmount, sale.currency)}</span> },
                ]}
              />
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-4 space-y-1 text-sm">
            <div className="font-medium text-base mb-2">Summary</div>
            <Row label="Customer" value={sale.customer ? `${sale.customer.code} — ${sale.customer.name}` : 'Walk-in'} />
            <Row label="Cashier" value={sale.cashierId} />
            <div className="my-2 border-t" />
            <Row label="Subtotal" value={formatCurrency(sale.subtotal, sale.currency)} />
            <Row label="Discount" value={`−${formatCurrency(sale.discountTotal, sale.currency)}`} />
            <Row label="Tax" value={formatCurrency(sale.taxTotal, sale.currency)} />
            <Row label="Total" value={formatCurrency(sale.grandTotal, sale.currency)} strong />
            <Row label="Paid" value={formatCurrency(sale.paidTotal, sale.currency)} />
            <Row label="Change" value={formatCurrency(sale.changeDue, sale.currency)} />
            {sale.creditAmount.gt(0) && (
              <Row label="On credit" value={formatCurrency(sale.creditAmount, sale.currency)} />
            )}
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium mb-2">Payments</div>
            <ul className="space-y-1 text-sm">
              {sale.payments.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span>{p.method.toLowerCase().replace('_', ' ')}</span>
                  <span className="tabular">{formatCurrency(p.amount, sale.currency)}</span>
                </li>
              ))}
            </ul>
          </Card>

          {canRefund && (
            <RefundForm
              saleId={sale.id}
              currency={sale.currency}
              items={sale.items.map((i) => ({
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

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? 'font-semibold pt-1 border-t mt-1' : 'text-muted-foreground'}`}>
      <span>{label}</span>
      <span className="tabular text-foreground">{value}</span>
    </div>
  );
}
