'use client';

import Link from 'next/link';
import { useActionState, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  createPurchaseOrderAction,
  type PurchaseFormState,
} from '@/server/actions/purchase';
import { formatCurrency } from '@/lib/money';
import type { CurrencyCode } from '@/lib/money';

const UNITS = ['PCS', 'KG', 'G', 'M', 'M2', 'L', 'ML', 'BOX', 'PACK', 'PAIR', 'SET'] as const;
const CURRENCIES = ['BDT', 'INR', 'USD', 'EUR'] as const;
const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm';

interface Row {
  key: string;
  productId: string;
  description: string;
  unit: (typeof UNITS)[number];
  orderedQty: string;
  unitPrice: string;
  taxRate: string;
  discountRate: string;
}

function newRow(): Row {
  return {
    key: `r-${Math.random().toString(36).slice(2, 8)}`,
    productId: '',
    description: '',
    unit: 'PCS',
    orderedQty: '',
    unitPrice: '',
    taxRate: '0',
    discountRate: '0',
  };
}

export interface ProductOption {
  id: string;
  sku: string;
  name: string;
  unit: string;
  costPrice: string;
}

export interface SupplierOption {
  id: string;
  code: string;
  name: string;
  currency: string;
}

export interface BranchOption {
  id: string;
  name: string;
  code: string;
  currency: string;
}

interface Props {
  branches: BranchOption[];
  suppliers: SupplierOption[];
  products: ProductOption[];
  prefill?: {
    requisitionId: string;
    branchId: string;
    items: { productName: string; unit: string; quantity: string }[];
  };
}

export function POForm({ branches, suppliers, products, prefill }: Props) {
  const [state, formAction, pending] = useActionState<PurchaseFormState, FormData>(
    createPurchaseOrderAction,
    undefined,
  );
  const [rows, setRows] = useState<Row[]>(() =>
    prefill
      ? prefill.items.map((i) => {
          const r = newRow();
          r.description = i.productName;
          r.orderedQty = i.quantity;
          r.unit = (UNITS.includes(i.unit as (typeof UNITS)[number])
            ? i.unit
            : 'PCS') as Row['unit'];
          return r;
        })
      : [newRow()],
  );
  const [branchId, setBranchId] = useState<string>(prefill?.branchId ?? branches[0]?.id ?? '');
  const [currency, setCurrency] = useState<CurrencyCode>('BDT');

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    let discount = 0;
    for (const r of rows) {
      const qty = Number(r.orderedQty) || 0;
      const price = Number(r.unitPrice) || 0;
      const tr = Number(r.taxRate) || 0;
      const dr = Number(r.discountRate) || 0;
      const gross = qty * price;
      const d = (gross * dr) / 100;
      const afterDisc = gross - d;
      const t = (afterDisc * tr) / 100;
      subtotal += gross;
      tax += t;
      discount += d;
    }
    return { subtotal, tax, discount, total: subtotal - discount + tax };
  }, [rows]);

  const E = (f: string) => state?.fieldErrors?.[f]?.[0];

  const updateRow = (key: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  return (
    <form action={formAction} className="space-y-6">
      {prefill && <input type="hidden" name="requisitionId" value={prefill.requisitionId} />}
      <input
        type="hidden"
        name="itemsJson"
        value={JSON.stringify(
          rows
            .filter((r) => r.productId && Number(r.orderedQty) > 0)
            .map((r) => ({
              productId: r.productId,
              description: r.description,
              unit: r.unit,
              orderedQty: r.orderedQty,
              unitPrice: r.unitPrice || 0,
              taxRate: r.taxRate || 0,
              discountRate: r.discountRate || 0,
            })),
        )}
      />

      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="branchId">
              Branch <span className="text-destructive">*</span>
            </Label>
            <select
              id="branchId"
              name="branchId"
              required
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className={selectClass}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplierId">
              Supplier <span className="text-destructive">*</span>
            </Label>
            <select id="supplierId" name="supplierId" required defaultValue="" className={selectClass}>
              <option value="">— select supplier —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
            {E('supplierId') && <p className="text-xs text-destructive">{E('supplierId')}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="deliveryDate">
              Delivery date <span className="text-destructive">*</span>
            </Label>
            <Input id="deliveryDate" name="deliveryDate" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              name="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className={selectClass}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
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
                className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_0.8fr_0.8fr_auto] gap-2 items-end"
              >
                <div>
                  {idx === 0 && <Label className="text-xs">Product</Label>}
                  <select
                    value={r.productId}
                    onChange={(e) => {
                      const p = products.find((x) => x.id === e.target.value);
                      updateRow(r.key, {
                        productId: e.target.value,
                        unit: (p?.unit as Row['unit']) ?? 'PCS',
                        unitPrice: p?.costPrice ?? r.unitPrice,
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
                    value={r.orderedQty}
                    onChange={(e) => updateRow(r.key, { orderedQty: e.target.value })}
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
                  {idx === 0 && <Label className="text-xs">Disc %</Label>}
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={r.discountRate}
                    onChange={(e) => updateRow(r.key, { discountRate: e.target.value })}
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
              <p className="text-xs text-muted-foreground">Discount</p>
              <p className="font-medium tabular text-red-600">
                − {formatCurrency(totals.discount, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tax</p>
              <p className="font-medium tabular">{formatCurrency(totals.tax, currency)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Grand total</p>
              <p className="font-semibold tabular text-lg">
                {formatCurrency(totals.total, currency)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" variant="dark" disabled={pending}>
          {pending ? 'Creating…' : 'Create Purchase Order'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/purchase/orders">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
