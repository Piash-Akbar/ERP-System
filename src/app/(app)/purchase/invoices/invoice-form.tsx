'use client';

import Link from 'next/link';
import { useActionState, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { createInvoiceAction, type PurchaseFormState } from '@/server/actions/purchase';
import { formatCurrency } from '@/lib/money';
import type { CurrencyCode } from '@/lib/money';

const UNITS = ['PCS', 'KG', 'G', 'M', 'M2', 'L', 'ML', 'BOX', 'PACK', 'PAIR', 'SET'] as const;
const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm';

interface Row {
  key: string;
  productId: string;
  description: string;
  unit: (typeof UNITS)[number];
  quantity: string;
  unitPrice: string;
  taxRate: string;
}

function newRow(): Row {
  return {
    key: `r-${Math.random().toString(36).slice(2, 8)}`,
    productId: '',
    description: '',
    unit: 'PCS',
    quantity: '',
    unitPrice: '',
    taxRate: '0',
  };
}

export interface ProductOption {
  id: string;
  sku: string;
  name: string;
  unit: string;
}

export interface InvoiceFormProps {
  branchId: string;
  supplierId: string;
  supplierName: string;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  grnId?: string;
  grnNumber?: string;
  currency: CurrencyCode;
  prefillItems?: {
    productId: string;
    description: string;
    unit: string;
    quantity: string;
    unitPrice: string;
    taxRate: string;
  }[];
  products: ProductOption[];
}

export function InvoiceForm({
  branchId,
  supplierId,
  supplierName,
  purchaseOrderId,
  purchaseOrderNumber,
  grnId,
  grnNumber,
  currency,
  prefillItems,
  products,
}: InvoiceFormProps) {
  const [state, formAction, pending] = useActionState<PurchaseFormState, FormData>(
    createInvoiceAction,
    undefined,
  );
  const [rows, setRows] = useState<Row[]>(() =>
    prefillItems && prefillItems.length > 0
      ? prefillItems.map((i) => ({
          key: `r-${Math.random().toString(36).slice(2, 8)}`,
          productId: i.productId,
          description: i.description,
          unit: (UNITS.includes(i.unit as (typeof UNITS)[number])
            ? (i.unit as Row['unit'])
            : 'PCS'),
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          taxRate: i.taxRate,
        }))
      : [newRow()],
  );
  const [discount, setDiscount] = useState('0');

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    for (const r of rows) {
      const qty = Number(r.quantity) || 0;
      const price = Number(r.unitPrice) || 0;
      const tr = Number(r.taxRate) || 0;
      const gross = qty * price;
      subtotal += gross;
      tax += (gross * tr) / 100;
    }
    const d = Number(discount) || 0;
    return { subtotal, tax, discount: d, total: subtotal + tax - d };
  }, [rows, discount]);

  const E = (f: string) => state?.fieldErrors?.[f]?.[0];

  const updateRow = (key: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="branchId" value={branchId} />
      <input type="hidden" name="supplierId" value={supplierId} />
      {purchaseOrderId && <input type="hidden" name="purchaseOrderId" value={purchaseOrderId} />}
      {grnId && <input type="hidden" name="grnId" value={grnId} />}
      <input type="hidden" name="currency" value={currency} />
      <input type="hidden" name="discountTotal" value={discount} />
      <input
        type="hidden"
        name="itemsJson"
        value={JSON.stringify(
          rows
            .filter((r) => r.productId && Number(r.quantity) > 0)
            .map((r) => ({
              productId: r.productId,
              description: r.description,
              unit: r.unit,
              quantity: r.quantity,
              unitPrice: r.unitPrice || 0,
              taxRate: r.taxRate || 0,
            })),
        )}
      />

      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label>Supplier</Label>
            <p className="text-sm font-medium">{supplierName}</p>
          </div>
          {purchaseOrderNumber && (
            <div className="space-y-1">
              <Label>PO Reference</Label>
              <p className="text-sm tabular">{purchaseOrderNumber}</p>
            </div>
          )}
          {grnNumber && (
            <div className="space-y-1">
              <Label>GRN Reference</Label>
              <p className="text-sm tabular">{grnNumber}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="invoiceDate">
              Invoice date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="invoiceDate"
              name="invoiceDate"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">
              Due date <span className="text-destructive">*</span>
            </Label>
            <Input id="dueDate" name="dueDate" type="date" required />
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              Line items <span className="text-destructive">*</span>
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRows((rs) => [...rs, newRow()])}
            >
              <Plus className="h-3 w-3" />
              Add Item
            </Button>
          </div>
          <div className="space-y-3">
            {rows.map((r, idx) => (
              <div
                key={r.key}
                className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_0.8fr_auto] gap-2 items-end"
              >
                <div>
                  {idx === 0 && <Label className="text-xs">Product</Label>}
                  <select
                    value={r.productId}
                    onChange={(e) => {
                      const p = products.find((x) => x.id === e.target.value);
                      updateRow(r.key, {
                        productId: e.target.value,
                        unit: (p?.unit as Row['unit']) ?? r.unit,
                      });
                    }}
                    className={selectClass}
                  >
                    <option value="">— select —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} · {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  {idx === 0 && <Label className="text-xs">Qty</Label>}
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={r.quantity}
                    onChange={(e) => updateRow(r.key, { quantity: e.target.value })}
                  />
                </div>
                <div>
                  {idx === 0 && <Label className="text-xs">Unit</Label>}
                  <select
                    value={r.unit}
                    onChange={(e) => updateRow(r.key, { unit: e.target.value as Row['unit'] })}
                    className={selectClass}
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  {idx === 0 && <Label className="text-xs">Unit price</Label>}
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={r.unitPrice}
                    onChange={(e) => updateRow(r.key, { unitPrice: e.target.value })}
                  />
                </div>
                <div>
                  {idx === 0 && <Label className="text-xs">Tax %</Label>}
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={r.taxRate}
                    onChange={(e) => updateRow(r.key, { taxRate: e.target.value })}
                  />
                </div>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={rows.length === 1}
                    onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {E('items') && <p className="text-xs text-destructive">{E('items')}</p>}

          <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Subtotal</p>
              <p className="font-medium tabular">{formatCurrency(totals.subtotal, currency)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tax</p>
              <p className="font-medium tabular">{formatCurrency(totals.tax, currency)}</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="discount" className="text-xs">
                Discount (total)
              </Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Grand total</p>
              <p className="font-semibold tabular text-lg">{formatCurrency(totals.total, currency)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" variant="dark" disabled={pending}>
          {pending ? 'Creating…' : 'Create Invoice'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/purchase/invoices">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
