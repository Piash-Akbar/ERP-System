'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, type CurrencyCode } from '@/lib/money';
import { recordCorporateInvoicePaymentAction } from '@/server/actions/corporate-sales';
import { CORP_PAYMENT_METHODS } from '@/server/validators/corporate-sales';

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
  const [method, setMethod] = useState<(typeof CORP_PAYMENT_METHODS)[number]>('BANK_TRANSFER');
  const [amount, setAmount] = useState<number>(balanceDue);
  const [reference, setReference] = useState('');
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (amount <= 0) return setMessage({ type: 'err', text: 'Enter an amount' });
    if (amount > balanceDue + 0.001)
      return setMessage({
        type: 'err',
        text: `Exceeds balance ${formatCurrency(balanceDue, currency)}`,
      });
    startTransition(async () => {
      const res = await recordCorporateInvoicePaymentAction({
        invoiceId,
        method,
        amount,
        reference: reference || undefined,
      });
      if (res && 'error' in res && res.error) return setMessage({ type: 'err', text: res.error });
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
          Balance <span className="tabular text-red-600">{formatCurrency(balanceDue, currency)}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Method</Label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as (typeof CORP_PAYMENT_METHODS)[number])}
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {CORP_PAYMENT_METHODS.map((m) => (
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
      <Button variant="dark" className="w-full" disabled={pending} onClick={submit}>
        {pending ? 'Saving…' : 'Record payment'}
      </Button>
    </Card>
  );
}
