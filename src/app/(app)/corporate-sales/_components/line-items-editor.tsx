'use client';

import { useMemo, useState } from 'react';
import { Trash2, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatCurrency, type CurrencyCode } from '@/lib/money';
import { CORP_DISCOUNT_APPROVAL_THRESHOLD } from '@/server/validators/corporate-sales';

export interface EditorProduct {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  unit: string;
  sellPrice: string;
  taxRate: string;
  imageUrl: string | null;
}

export interface EditorLine {
  productId: string;
  sku: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  taxRate: number;
  description: string;
}

function lineNet(l: EditorLine) {
  const gross = l.quantity * l.unitPrice;
  const discount = gross * (l.discountRate / 100);
  const net = gross - discount;
  const tax = net * (l.taxRate / 100);
  return { gross, discount, net, tax, total: net + tax };
}

export function LineItemsEditor({
  currency,
  initialProducts,
  value,
  onChange,
  searchUrl = '/api/wholesale/search',
}: {
  currency: CurrencyCode;
  initialProducts: EditorProduct[];
  value: EditorLine[];
  onChange: (lines: EditorLine[]) => void;
  searchUrl?: string;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState('');

  const totals = useMemo(() => {
    return value.reduce(
      (a, l) => {
        const ln = lineNet(l);
        a.subtotal += ln.gross;
        a.discount += ln.discount;
        a.tax += ln.tax;
        a.total += ln.total;
        return a;
      },
      { subtotal: 0, discount: 0, tax: 0, total: 0 },
    );
  }, [value]);

  const fmt = (v: number) => formatCurrency(v, currency);

  async function search(q: string) {
    setQuery(q);
    const res = await fetch(`${searchUrl}?q=${encodeURIComponent(q)}`);
    if (res.ok) setProducts(await res.json());
  }

  function addProduct(p: EditorProduct) {
    const hit = value.find((l) => l.productId === p.id);
    if (hit) {
      onChange(
        value.map((l) =>
          l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l,
        ),
      );
      return;
    }
    onChange([
      ...value,
      {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        unit: p.unit,
        quantity: 1,
        unitPrice: Number(p.sellPrice),
        discountRate: 0,
        taxRate: Number(p.taxRate),
        description: '',
      },
    ]);
  }

  function patch(idx: number, p: Partial<EditorLine>) {
    onChange(value.map((l, i) => (i === idx ? { ...l, ...p } : l)));
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
      <Card className="p-0">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search products by SKU or name…"
              value={query}
              onChange={(e) => search(e.target.value)}
            />
          </div>
        </div>
        <div className="max-h-96 overflow-auto divide-y">
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => addProduct(p)}
              className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-muted/50"
            >
              <div>
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.sku}</div>
              </div>
              <div className="text-sm tabular text-blue-600">
                {fmt(Number(p.sellPrice))}
              </div>
            </button>
          ))}
          {products.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">No products match.</div>
          )}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden flex flex-col">
        <div className="px-4 py-2 border-b text-sm font-medium">
          Lines · {value.length}
        </div>
        <div className="flex-1 overflow-y-auto divide-y max-h-96">
          {value.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-10">
              Add products from the left.
            </div>
          )}
          {value.map((l, i) => {
            const ln = lineNet(l);
            const flag = l.discountRate > CORP_DISCOUNT_APPROVAL_THRESHOLD;
            return (
              <div key={l.productId} className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">{l.sku}</div>
                    <div className="text-sm font-medium truncate">{l.name}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="text-muted-foreground hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <label className="space-y-0.5">
                    <span className="text-muted-foreground">Qty</span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={l.quantity}
                      onChange={(e) => patch(i, { quantity: Number(e.target.value) })}
                      className="w-full rounded border px-1.5 py-1 text-right tabular"
                    />
                  </label>
                  <label className="space-y-0.5">
                    <span className="text-muted-foreground">Price</span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={l.unitPrice}
                      onChange={(e) => patch(i, { unitPrice: Number(e.target.value) })}
                      className="w-full rounded border px-1.5 py-1 text-right tabular"
                    />
                  </label>
                  <label className="space-y-0.5">
                    <span className="text-muted-foreground">Disc %</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="any"
                      value={l.discountRate}
                      onChange={(e) => patch(i, { discountRate: Number(e.target.value) })}
                      className={`w-full rounded border px-1.5 py-1 text-right tabular ${
                        flag ? 'border-amber-500 text-amber-700' : ''
                      }`}
                    />
                  </label>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax {l.taxRate}%</span>
                  <span className="font-medium tabular">{fmt(ln.total)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t p-3 space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular">{fmt(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Discount</span>
            <span className="tabular">−{fmt(totals.discount)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax</span>
            <span className="tabular">{fmt(totals.tax)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold pt-2 border-t mt-2">
            <span>Total</span>
            <span className="tabular">{fmt(totals.total)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export { lineNet };
