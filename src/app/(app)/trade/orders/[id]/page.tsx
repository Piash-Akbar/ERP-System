import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Ship, FileText, CreditCard } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Pill, type PillTone } from '@/components/shared/pill';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getSession } from '@/server/auth/session';
import { tradeService } from '@/server/services/trade.service';
import { formatCurrency } from '@/lib/money';
import { TradeOrderStatusActions } from '@/components/trade/trade-order-status-actions';
import { AddShipmentButton } from '@/components/trade/add-shipment-button';

export const metadata = { title: 'Trade Order' };

const STATUS_TONE: Record<string, PillTone> = {
  DRAFT: 'grey', CONFIRMED: 'blue', IN_PRODUCTION: 'amber', READY_TO_SHIP: 'amber',
  SHIPPED: 'blue', AT_CUSTOMS: 'amber', DELIVERED: 'green', COMPLETED: 'green', CANCELLED: 'red',
};

const SHIP_STATUS_TONE: Record<string, PillTone> = {
  PENDING: 'grey', BOOKING_CONFIRMED: 'blue', IN_TRANSIT: 'blue',
  AT_PORT: 'amber', CUSTOMS_CLEARANCE: 'amber', DELIVERED: 'green', CANCELLED: 'red',
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1.5 text-sm border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value ?? '—'}</span>
    </div>
  );
}

export default async function TradeOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const order = await tradeService.getOrder(session, id).catch(() => null);
  if (!order) notFound();

  const counterparty = order.customer ?? order.supplier;

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.number}
        description={`${order.type} Order — ${order.incoterms ?? ''} ${order.currency}`}
      >
        <Pill tone={STATUS_TONE[order.status] ?? 'grey'}>{order.status.replace(/_/g, ' ')}</Pill>
        <TradeOrderStatusActions orderId={order.id} currentStatus={order.status} />
        {!order.lc && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/trade/lc/new?orderId=${order.id}`}>
              <CreditCard className="mr-1 h-3.5 w-3.5" />
              Issue LC
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Order Details</CardTitle></CardHeader>
            <CardContent>
              <Row label="Order Number" value={<span className="font-mono">{order.number}</span>} />
              <Row label="Type" value={<Pill tone={order.type === 'EXPORT' ? 'blue' : 'amber'}>{order.type}</Pill>} />
              <Row label={order.type === 'EXPORT' ? 'Customer' : 'Supplier'} value={counterparty?.name} />
              <Row label="Contract Ref" value={order.contractRef} />
              <Row label="Incoterms" value={order.incoterms} />
              <Row label="Currency" value={order.currency} />
              <Row label="Total Value" value={formatCurrency(order.totalValue.toString(), order.currency)} />
              <Row label="Exchange Rate" value={`1 ${order.currency} = ${order.exchangeRate} BDT`} />
              <Row label="Local Value (BDT)" value={formatCurrency(order.localValue.toString(), 'BDT')} />
              <Row label="Port of Loading" value={order.portOfLoading} />
              <Row label="Port of Discharge" value={order.portOfDischarge} />
              <Row label="Latest Ship Date" value={order.latestShipDate ? new Date(order.latestShipDate).toLocaleDateString() : null} />
              <Row label="Expected Arrival" value={order.expectedArrival ? new Date(order.expectedArrival).toLocaleDateString() : null} />
            </CardContent>
          </Card>

          {order.goodsDescription && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Goods Description</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.goodsDescription}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-sm">Line Items</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-xs border-b">
                    <th className="text-left py-2">Description</th>
                    <th className="text-left py-2">HS Code</th>
                    <th className="text-right py-2">Qty</th>
                    <th className="text-right py-2">Unit Price</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2">{item.description}</td>
                      <td className="py-2 text-muted-foreground font-mono text-xs">{item.hsCode ?? '—'}</td>
                      <td className="py-2 text-right tabular-nums">{item.quantity.toString()} {item.unit}</td>
                      <td className="py-2 text-right tabular-nums">{item.unitPrice.toString()}</td>
                      <td className="py-2 text-right tabular-nums font-medium">{item.lineTotal.toString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold">
                    <td colSpan={4} className="py-2 text-right">Total</td>
                    <td className="py-2 text-right tabular-nums">{formatCurrency(order.totalValue.toString(), order.currency)}</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          {/* Shipments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Shipments</CardTitle>
              <AddShipmentButton tradeOrderId={order.id} />
            </CardHeader>
            <CardContent>
              {order.shipments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No shipments recorded.</p>
              ) : (
                <div className="divide-y">
                  {order.shipments.map((s) => (
                    <div key={s.id} className="py-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Shipment #{s.sequence}</span>
                        <Pill tone={SHIP_STATUS_TONE[s.status] ?? 'grey'}>{s.status.replace(/_/g, ' ')}</Pill>
                      </div>
                      <div className="text-xs text-muted-foreground grid grid-cols-2 gap-1">
                        {s.vesselName && <span>Vessel: {s.vesselName}</span>}
                        {s.blNumber && <span>BL: {s.blNumber}</span>}
                        {s.etd && <span>ETD: {new Date(s.etd).toLocaleDateString()}</span>}
                        {s.eta && <span>ETA: {new Date(s.eta).toLocaleDateString()}</span>}
                        {s.carrierName && <span>Carrier: {s.carrierName}</span>}
                        {s.containerNumbers && <span>Containers: {s.containerNumbers}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Foreign Payments</CardTitle></CardHeader>
            <CardContent>
              {order.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded.</p>
              ) : (
                <div className="divide-y">
                  {order.payments.map((p) => (
                    <div key={p.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-mono">{p.number}</p>
                        <p className="text-xs text-muted-foreground">{p.bankName} — {p.swiftRef}</p>
                        {p.paymentDate && <p className="text-xs text-muted-foreground">{new Date(p.paymentDate).toLocaleDateString()}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums">{formatCurrency(p.amount.toString(), p.currency)}</p>
                        <p className="text-xs text-muted-foreground">@ {p.exchangeRate.toString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {order.lc ? (
            <Card>
              <CardHeader><CardTitle className="text-sm">Letter of Credit</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/trade/lc/${order.lc.id}`} className="text-primary hover:underline font-mono text-sm">
                  {order.lc.number}
                </Link>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{order.lc.type.replace(/_/g, ' ')}</p>
                  <p className="tabular-nums font-medium">{formatCurrency(order.lc.lcAmount.toString(), order.lc.currency)}</p>
                </div>
                <Pill tone={
                  ({ ACTIVE: 'green', ISSUED: 'blue', DRAFT: 'grey', EXPIRED: 'red', FULLY_UTILIZED: 'grey', CANCELLED: 'red' } as Record<string, PillTone>)[order.lc.status] ?? 'grey'
                }>{order.lc.status.replace(/_/g, ' ')}</Pill>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-3">No LC issued for this order.</p>
                <Button size="sm" asChild>
                  <Link href={`/trade/lc/new?orderId=${order.id}`}>Issue LC</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-sm">Counterparty</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">{counterparty?.name}</p>
              <p className="text-muted-foreground text-xs">{counterparty?.email}</p>
              <p className="text-muted-foreground text-xs">{counterparty?.phone}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
