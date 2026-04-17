'use client';

import Link from 'next/link';
import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { Trash2, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import type { StockFormState } from '@/server/actions/stock';

export type MovementMode = 'receive' | 'issue' | 'transfer';

export interface ProductOption {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  unit: string;
  costPrice: string;
  sellPrice: string;
}

export interface WarehouseOption {
  id: string;
  name: string;
  code: string;
}

interface Row {
  productId: string;
  sku: string;
  name: string;
  unit: string;
  quantity: string;
  costPerUnit: string;
}

export interface StockMovementFormProps {
  mode: MovementMode;
  branchId: string;
  warehouses: WarehouseOption[];
  products: ProductOption[];
  action: (prev: StockFormState, formData: FormData) => Promise<StockFormState>;
  submitLabel: string;
  showCost: boolean;
  continuousScanDefault?: boolean;
}

export function StockMovementForm({
  mode,
  branchId,
  warehouses,
  products,
  action,
  submitLabel,
  showCost,
  continuousScanDefault = true,
}: StockMovementFormProps) {
  const [state, formAction, pending] = useActionState<StockFormState, FormData>(action, undefined);
  const [rows, setRows] = useState<Row[]>([]);
  const [continuous, setContinuous] = useState(continuousScanDefault);
  const scanRef = useRef<HTMLInputElement>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    scanRef.current?.focus();
  }, []);

  const byBarcode = useMemo(() => {
    const m = new Map<string, ProductOption>();
    for (const p of products) {
      if (p.barcode) m.set(p.barcode.toUpperCase(), p);
      m.set(p.sku.toUpperCase(), p);
    }
    return m;
  }, [products]);

  const addProduct = (p: ProductOption, quantity = '1') => {
    setRows((prev) => {
      const existing = prev.findIndex((r) => r.productId === p.id);
      if (existing >= 0) {
        const copy = [...prev];
        const cur = copy[existing];
        if (cur) {
          const newQty = (Number(cur.quantity) + Number(quantity)).toString();
          copy[existing] = { ...cur, quantity: newQty };
        }
        return copy;
      }
      return [
        ...prev,
        {
          productId: p.id,
          sku: p.sku,
          name: p.name,
          unit: p.unit,
          quantity,
          costPerUnit: showCost ? p.costPrice : '0',
        },
      ];
    });
  };

  const onScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const raw = scanRef.current?.value.trim() ?? '';
    if (!raw) return;
    const found = byBarcode.get(raw.toUpperCase());
    if (!found) {
      setScanError(`No product matches "${raw}"`);
    } else {
      setScanError(null);
      addProduct(found);
    }
    if (scanRef.current) scanRef.current.value = '';
    if (!continuous) scanRef.current?.blur();
  };

  const updateQty = (idx: number, value: string) => {
    setRows((prev) => {
      const copy = [...prev];
      const cur = copy[idx];
      if (cur) copy[idx] = { ...cur, quantity: value };
      return copy;
    });
  };
  const updateCost = (idx: number, value: string) => {
    setRows((prev) => {
      const copy = [...prev];
      const cur = copy[idx];
      if (cur) copy[idx] = { ...cur, costPerUnit: value };
      return copy;
    });
  };
  const removeRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx));

  const totalQty = rows.reduce((a, r) => a + Number(r.quantity || 0), 0);

  const itemsJson = JSON.stringify(
    rows.map((r) => ({
      productId: r.productId,
      quantity: r.quantity,
      costPerUnit: r.costPerUnit || '0',
    })),
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="branchId" value={branchId} />
      <input type="hidden" name="itemsJson" value={itemsJson} />

      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {mode === 'transfer' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="fromWarehouseId">From warehouse</Label>
                <select
                  id="fromWarehouseId"
                  name="fromWarehouseId"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="toWarehouseId">To warehouse</Label>
                <select
                  id="toWarehouseId"
                  name="toWarehouseId"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Note</Label>
                <Input id="note" name="note" placeholder="Optional" />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="warehouseId">Warehouse</Label>
                <select
                  id="warehouseId"
                  name="warehouseId"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="refType">Reason</Label>
                <select
                  id="refType"
                  name="refType"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  {mode === 'receive' ? (
                    <>
                      <option value="OPENING">Opening balance</option>
                      <option value="GRN">Goods receiving</option>
                      <option value="RETURN">Customer return</option>
                      <option value="MANUAL_ADJUST">Manual adjustment</option>
                    </>
                  ) : (
                    <>
                      <option value="SALE">Sale</option>
                      <option value="DAMAGE">Damage / loss</option>
                      <option value="CONSUMPTION">Consumption</option>
                      <option value="MANUAL_ADJUST">Manual adjustment</option>
                    </>
                  )}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="refId">Reference #</Label>
                <Input id="refId" name="refId" placeholder="Optional (e.g. INV-0042)" />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="note">Note</Label>
                <Textarea id="note" name="note" rows={1} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={scanRef}
                onKeyDown={onScan}
                placeholder="Scan barcode or type SKU and press Enter…"
                className="pl-9"
                autoComplete="off"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={continuous}
                onChange={(e) => setContinuous(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Continuous scan
            </label>
          </div>
          {scanError && <p className="text-xs text-destructive">{scanError}</p>}

          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left font-semibold px-3 py-2">#</th>
                  <th className="text-left font-semibold px-3 py-2">SKU</th>
                  <th className="text-left font-semibold px-3 py-2">Name</th>
                  <th className="text-right font-semibold px-3 py-2">Quantity</th>
                  <th className="text-left font-semibold px-3 py-2">Unit</th>
                  {showCost && <th className="text-right font-semibold px-3 py-2">Cost / unit</th>}
                  <th className="text-right font-semibold px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={showCost ? 7 : 6}
                      className="px-3 py-10 text-center text-muted-foreground text-sm"
                    >
                      Scan or type a barcode / SKU to add items.
                    </td>
                  </tr>
                )}
                {rows.map((r, i) => (
                  <tr key={r.productId}>
                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.sku}</td>
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2 text-right">
                      <Input
                        value={r.quantity}
                        onChange={(e) => updateQty(i, e.target.value)}
                        type="text"
                        inputMode="decimal"
                        className="h-8 w-28 text-right tabular ml-auto"
                      />
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{r.unit}</td>
                    {showCost && (
                      <td className="px-3 py-2 text-right">
                        <Input
                          value={r.costPerUnit}
                          onChange={(e) => updateCost(i, e.target.value)}
                          type="text"
                          inputMode="decimal"
                          className="h-8 w-28 text-right tabular ml-auto"
                        />
                      </td>
                    )}
                    <td className="px-3 py-2 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeRow(i)}
                        aria-label="Remove row"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr className="bg-muted/30">
                    <td colSpan={3} className="px-3 py-2 font-medium">
                      Total items: {rows.length}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular">{totalQty}</td>
                    <td colSpan={showCost ? 3 : 2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending || rows.length === 0}>
          {pending ? 'Posting…' : submitLabel}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/inventory/stock">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
