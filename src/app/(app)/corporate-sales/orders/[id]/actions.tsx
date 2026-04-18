'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, type CurrencyCode } from '@/lib/money';
import {
  recordCorporateDeliveryAction,
  createCorporateInvoiceAction,
  cancelCorporateOrderAction,
} from '@/server/actions/corporate-sales';

interface OrderItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  deliveredQty: number;
  invoicedQty: number;
  unitPrice: number;
}

export function OrderActions({
  orderId,
  status,
  warehouseId,
  warehouseName,
  items,
  currency,
}: {
  orderId: string;
  status: string;
  warehouseId: string;
  warehouseName: string;
  items: OrderItem[];
  currency: CurrencyCode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [delivQty, setDelivQty] = useState<Record<string, number>>({});
  const [invoiceQty, setInvoiceQty] = useState<Record<string, number>>({});
  const [trackingNo, setTrackingNo] = useState('');
  const [carrier, setCarrier] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const canAct =
    status === 'CONFIRMED' || status === 'PARTIALLY_DELIVERED' || status === 'DELIVERED';
  const anyDeliverable = items.some((i) => i.quantity - i.deliveredQty > 0);
  const anyInvoiceable = items.some((i) => i.deliveredQty - i.invoicedQty > 0);
  const canCancel = status === 'CONFIRMED' && items.every((i) => i.deliveredQty === 0);

  function runDelivery() {
    const list = Object.entries(delivQty)
      .filter(([, q]) => q > 0)
      .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));
    if (list.length === 0)
      return setMessage({ type: 'err', text: 'Enter at least one delivered quantity' });
    startTransition(async () => {
      const res = await recordCorporateDeliveryAction({
        orderId,
        warehouseId,
        trackingNo: trackingNo || undefined,
        carrier: carrier || undefined,
        items: list,
      });
      if (res && 'error' in res && res.error) return setMessage({ type: 'err', text: res.error });
      if (res && 'success' in res && res.success) {
        setMessage({ type: 'ok', text: `Delivery ${res.deliveryNumber} recorded` });
        setDelivQty({});
        setTrackingNo('');
        setCarrier('');
        router.refresh();
      }
    });
  }

  function runInvoice() {
    const list = Object.entries(invoiceQty)
      .filter(([, q]) => q > 0)
      .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));
    if (list.length === 0)
      return setMessage({ type: 'err', text: 'Enter at least one invoice quantity' });
    startTransition(async () => {
      const res = await createCorporateInvoiceAction({
        orderId,
        dueDate: dueDate || undefined,
        items: list,
      });
      if (res && 'error' in res && res.error) return setMessage({ type: 'err', text: res.error });
      if (res && 'success' in res && res.success) {
        router.push(`/corporate-sales/invoices/${res.invoiceId}`);
      }
    });
  }

  function runCancel() {
    if (cancelReason.trim().length < 3)
      return setMessage({ type: 'err', text: 'Reason is required' });
    startTransition(async () => {
      const res = await cancelCorporateOrderAction({ orderId, reason: cancelReason });
      if (res && 'error' in res && res.error) return setMessage({ type: 'err', text: res.error });
      if (res && 'success' in res && res.success) {
        setMessage({ type: 'ok', text: 'Order canceled' });
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      {canAct && anyDeliverable && (
        <Card className="p-4 space-y-3">
          <div className="text-sm font-medium">Record delivery</div>
          <div className="text-xs text-muted-foreground">
            From <span className="font-medium">{warehouseName}</span>. Stock decrements on save.
          </div>
          <div className="space-y-2">
            {items.map((i) => {
              const remaining = i.quantity - i.deliveredQty;
              if (remaining <= 0) return null;
              return (
                <div key={i.id} className="flex items-center gap-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{i.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {i.sku} · {remaining} left
                    </div>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={remaining}
                    step="any"
                    className="w-20 text-right tabular"
                    value={delivQty[i.id] ?? ''}
                    onChange={(e) =>
                      setDelivQty((p) => ({ ...p, [i.id]: Number(e.target.value) }))
                    }
                  />
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Tracking #</Label>
              <Input value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)} />
            </div>
            <div>
              <Label>Carrier</Label>
              <Input value={carrier} onChange={(e) => setCarrier(e.target.value)} />
            </div>
          </div>
          <Button variant="dark" className="w-full" disabled={pending} onClick={runDelivery}>
            {pending ? 'Saving…' : 'Record delivery'}
          </Button>
        </Card>
      )}

      {canAct && anyInvoiceable && (
        <Card className="p-4 space-y-3">
          <div className="text-sm font-medium">Create invoice</div>
          <div className="text-xs text-muted-foreground">
            Only delivered-but-not-yet-invoiced quantities are billable.
          </div>
          <div className="space-y-2">
            {items.map((i) => {
              const billable = i.deliveredQty - i.invoicedQty;
              if (billable <= 0) return null;
              return (
                <div key={i.id} className="flex items-center gap-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{i.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {i.sku} · {billable} · {formatCurrency(i.unitPrice, currency)}
                    </div>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={billable}
                    step="any"
                    className="w-20 text-right tabular"
                    value={invoiceQty[i.id] ?? ''}
                    onChange={(e) =>
                      setInvoiceQty((p) => ({ ...p, [i.id]: Number(e.target.value) }))
                    }
                  />
                </div>
              );
            })}
          </div>
          <div>
            <Label>Due date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <Button variant="outline" className="w-full" disabled={pending} onClick={runInvoice}>
            {pending ? 'Saving…' : 'Create invoice'}
          </Button>
        </Card>
      )}

      {canCancel && (
        <Card className="p-4 space-y-2">
          <div className="text-sm font-medium">Cancel order</div>
          <Input
            placeholder="Reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <Button
            variant="outline"
            className="w-full text-red-600"
            disabled={pending}
            onClick={runCancel}
          >
            Cancel order
          </Button>
        </Card>
      )}

      {message && (
        <div
          className={`text-sm rounded-md px-3 py-2 ${
            message.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
