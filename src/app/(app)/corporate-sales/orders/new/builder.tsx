'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { type CurrencyCode } from '@/lib/money';
import { createCorporateOrderAction } from '@/server/actions/corporate-sales';
import { PAYMENT_TERMS } from '@/server/validators/corporate-sales';
import { LineItemsEditor, type EditorLine, type EditorProduct } from '../../_components/line-items-editor';

export function OrderBuilder({
  branch,
  warehouses,
  customers,
  initialProducts,
}: {
  branch: { id: string; name: string; currency: CurrencyCode };
  warehouses: { id: string; name: string; code: string }[];
  customers: { id: string; code: string; name: string; type: string; currency: CurrencyCode }[];
  initialProducts: EditorProduct[];
}) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState('');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? '');
  const [paymentTerms, setPaymentTerms] =
    useState<(typeof PAYMENT_TERMS)[number]>('NET_30');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<EditorLine[]>([]);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  function submit() {
    if (!customerId) return setMessage({ type: 'err', text: 'Pick a customer' });
    if (!warehouseId) return setMessage({ type: 'err', text: 'Pick a warehouse' });
    if (lines.length === 0) return setMessage({ type: 'err', text: 'Add at least one line' });
    startTransition(async () => {
      const res = await createCorporateOrderAction({
        branchId: branch.id,
        warehouseId,
        customerId,
        paymentTerms,
        expectedDate: expectedDate || undefined,
        notes: notes || undefined,
        items: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discountRate: l.discountRate,
          taxRate: l.taxRate,
        })),
      });
      if (res && 'error' in res && res.error) return setMessage({ type: 'err', text: res.error });
      if (res && 'success' in res && res.success) {
        router.push(`/corporate-sales/orders/${res.orderId}`);
      }
    });
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <Label>Customer</Label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">Select customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
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
          <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
        </div>
        <div className="md:col-span-4">
          <Label>Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={1} />
        </div>
      </Card>

      <LineItemsEditor
        currency={branch.currency}
        initialProducts={initialProducts}
        value={lines}
        onChange={setLines}
        searchUrl="/api/corporate-sales/search"
      />

      {message && (
        <div
          className={`text-sm rounded-md px-3 py-2 ${
            message.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}
      <div className="flex justify-end">
        <Button
          variant="dark"
          onClick={submit}
          disabled={pending || lines.length === 0 || !customerId || !warehouseId}
        >
          {pending ? 'Creating…' : 'Confirm order'}
        </Button>
      </div>
    </div>
  );
}
