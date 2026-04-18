'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, type CurrencyCode } from '@/lib/money';
import { recordWholesalePaymentAction } from '@/server/actions/wholesale';
import { WHOLESALE_PAYMENT_METHODS } from '@/server/validators/wholesale';

export function PaymentForm({
  invoiceId,
  balanceDue,
  currency,
}: {
  invoiceId: string;
  balanceDue: number;
  currency: CurrencyCode;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<(typeof WHOLESALE_PAYMENT_METHODS)[number]>('CASH');
  const [amount, setAmount] = useState<number>(balanceDue);
  const [reference, setReference] = useState('');
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (amount <= 0) {
      setMessage({ type: 'err', text: 'Enter an amount greater than zero' });
      return;
    }
    if (amount > balanceDue + 0.001) {
      setMessage({ type: 'err', text: `Amount exceeds balance due ${formatCurrency(balanceDue, currency)}` });
      return;
    }
    startTransition(async () => {
      const res = await recordWholesalePaymentAction({
        invoiceId,
        method,
        amount,
        reference: reference || undefined,
      });
      if (res && 'error' in res && res.error) {
        setMessage({ type: 'err', text: res.error });
        return;
      }
      if (res && 'success' in res && res.success) {
        setMessage({ type: 'ok', text: 'Payment recorded' });
        setAmount(0);
        setReference('');
        router.refresh();
      }
    });
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Record payment</div>
        <div className="text-xs text-muted-foreground">
          Balance due <span className="tabular text-red-600">{formatCurrency(balanceDue, currency)}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Method</Label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as (typeof WHOLESALE_PAYMENT_METHODS)[number])}
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {WHOLESALE_PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Amount</Label>
          <Input
            type="number"
            min={0}
            step="any"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="text-right tabular"
          />
        </div>
      </div>
      <div>
        <Label>Reference</Label>
        <Input value={reference} onChange={(e) => setReference(e.target.value)} />
      </div>
      {message && (
        <div
          className={`text-sm rounded-md px-3 py-2 ${
            message.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}
      <Button variant="dark" onClick={submit} disabled={pending || balanceDue <= 0} className="w-full">
        {pending ? 'Saving…' : 'Record payment'}
      </Button>
    </Card>
  );
}
