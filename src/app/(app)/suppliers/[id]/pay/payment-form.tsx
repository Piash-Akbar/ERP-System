'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  recordSupplierPaymentAction,
  type PaymentFormState,
} from '@/server/actions/suppliers';

const METHODS = [
  ['BANK_TRANSFER', 'Bank transfer'],
  ['CASH', 'Cash'],
  ['CHEQUE', 'Cheque'],
  ['WIRE_TRANSFER', 'Wire transfer'],
  ['MOBILE_BANKING', 'Mobile banking'],
  ['OTHER', 'Other'],
] as const;

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm';

export interface PaymentFormProps {
  supplierId: string;
  supplierName: string;
  openInvoices: { id: string; number: string; grandTotal: string; paidAmount: string; dueDate: string }[];
}

export function PaymentForm({ supplierId, supplierName, openInvoices }: PaymentFormProps) {
  const [state, formAction, pending] = useActionState<PaymentFormState, FormData>(
    recordSupplierPaymentAction,
    undefined,
  );
  const E = (f: string) => state?.fieldErrors?.[f]?.[0];

  useEffect(() => {
    if (state?.success) toast.success(`Payment recorded for ${supplierName}`);
  }, [state?.success, supplierName]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="supplierId" value={supplierId} />

      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount <span className="text-destructive">*</span>
            </Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
            />
            {E('amount') && <p className="text-xs text-destructive">{E('amount')}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">
              Payment date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="paymentDate"
              name="paymentDate"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Method</Label>
            <select id="method" name="method" defaultValue="BANK_TRANSFER" className={selectClass}>
              {METHODS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceId">Apply to invoice (optional)</Label>
            <select id="invoiceId" name="invoiceId" defaultValue="" className={selectClass}>
              <option value="">— none / general payment —</option>
              {openInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.number} — due {new Date(inv.dueDate).toLocaleDateString()} (total {inv.grandTotal}, paid {inv.paidAmount})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="reference">Reference (cheque / txn ID)</Label>
            <Input id="reference" name="reference" placeholder="e.g. CHQ-123456" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
        </CardContent>
      </Card>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" variant="dark" disabled={pending}>
          {pending ? 'Recording…' : 'Record Payment'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`/suppliers/${supplierId}`}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
