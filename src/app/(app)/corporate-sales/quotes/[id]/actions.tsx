'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  updateCorporateQuoteStatusAction,
  convertCorporateQuoteAction,
} from '@/server/actions/corporate-sales';
import { PAYMENT_TERMS } from '@/server/validators/corporate-sales';

export function QuoteActions({
  quoteId,
  status,
  warehouses,
}: {
  quoteId: string;
  status: string;
  warehouses: { id: string; name: string; code: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? '');
  const [paymentTerms, setPaymentTerms] =
    useState<(typeof PAYMENT_TERMS)[number]>('NET_30');
  const [expectedDate, setExpectedDate] = useState('');

  function run(fn: () => Promise<{ error?: string; success?: boolean } & Record<string, unknown>>) {
    startTransition(async () => {
      const res = await fn();
      if (res.error) return setMessage({ type: 'err', text: res.error });
      setMessage({ type: 'ok', text: 'Saved' });
      router.refresh();
    });
  }

  const isOpen = status === 'DRAFT' || status === 'SENT' || status === 'ACCEPTED';

  return (
    <Card className="p-4 space-y-4">
      <div className="text-sm font-medium">Actions</div>
      {!isOpen && (
        <div className="text-xs text-muted-foreground">
          Quote is {status.toLowerCase()} — no further actions.
        </div>
      )}

      {status === 'DRAFT' && (
        <Button
          variant="outline"
          className="w-full"
          disabled={pending}
          onClick={() => run(() => updateCorporateQuoteStatusAction({ quoteId, status: 'SENT' }))}
        >
          Mark sent
        </Button>
      )}

      {(status === 'DRAFT' || status === 'SENT') && (
        <>
          <Button
            variant="outline"
            className="w-full"
            disabled={pending}
            onClick={() =>
              run(() => updateCorporateQuoteStatusAction({ quoteId, status: 'ACCEPTED' }))
            }
          >
            Mark accepted
          </Button>
          <div className="space-y-1">
            <Label>Reject reason</Label>
            <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            <Button
              variant="outline"
              className="w-full"
              disabled={pending}
              onClick={() =>
                run(() =>
                  updateCorporateQuoteStatusAction({
                    quoteId,
                    status: 'REJECTED',
                    rejectReason: rejectReason || undefined,
                  }),
                )
              }
            >
              Reject
            </Button>
          </div>
        </>
      )}

      {isOpen && (
        <div className="border-t pt-3 space-y-2">
          <div className="text-sm font-medium">Convert to order</div>
          <div>
            <Label>Warehouse</Label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Payment terms</Label>
            <select
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value as (typeof PAYMENT_TERMS)[number])}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {PAYMENT_TERMS.map((t) => (
                <option key={t} value={t}>
                  {t.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Expected delivery</Label>
            <Input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
            />
          </div>
          <Button
            variant="dark"
            className="w-full"
            disabled={pending || !warehouseId}
            onClick={() =>
              startTransition(async () => {
                const res = await convertCorporateQuoteAction({
                  quoteId,
                  warehouseId,
                  paymentTerms,
                  expectedDate: expectedDate || undefined,
                });
                if (res && 'error' in res && res.error)
                  return setMessage({ type: 'err', text: res.error });
                if (res && 'success' in res && res.success) {
                  router.push(`/corporate-sales/orders/${res.orderId}`);
                }
              })
            }
          >
            Convert to order
          </Button>
        </div>
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
    </Card>
  );
}
