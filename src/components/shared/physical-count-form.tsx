'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useActionState } from 'react';
import { ScanLine, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { postPhysicalCountAction, type StockFormState } from '@/server/actions/stock';

export interface PhysicalCountProductOption {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  unit: string;
}

export interface PhysicalCountWarehouseOption {
  id: string;
  name: string;
  code: string;
}

interface Row {
  productId: string;
  sku: string;
  name: string;
  unit: string;
  system: string;
  counted: string;
}

export interface PhysicalCountFormProps {
  branchId: string;
  warehouses: PhysicalCountWarehouseOption[];
  products: PhysicalCountProductOption[];
  /** map from productId → current system balance */
  balanceByProduct: Record<string, string>;
}

export function PhysicalCountForm({
  branchId,
  warehouses,
  products,
  balanceByProduct,
}: PhysicalCountFormProps) {
  const [state, formAction, pending] = useActionState<StockFormState, FormData>(
    postPhysicalCountAction,
    undefined,
  );
  const [rows, setRows] = useState<Row[]>([]);
  const [warehouseId, setWarehouseId] = useState<string>(warehouses[0]?.id ?? '');
  const [continuous, setContinuous] = useState(true);
  const scanRef = useRef<HTMLInputElement>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    scanRef.current?.focus();
  }, []);

  const byCode = useMemo(() => {
    const m = new Map<string, PhysicalCountProductOption>();
    for (const p of products) {
      if (p.barcode) m.set(p.barcode.toUpperCase(), p);
      m.set(p.sku.toUpperCase(), p);
    }
    return m;
  }, [products]);

  const addProduct = (p: PhysicalCountProductOption) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.productId === p.id);
      if (idx >= 0) {
        const copy = [...prev];
        const cur = copy[idx];
        if (cur) copy[idx] = { ...cur, counted: (Number(cur.counted || 0) + 1).toString() };
        return copy;
      }
      return [
        ...prev,
        {
          productId: p.id,
          sku: p.sku,
          name: p.name,
          unit: p.unit,
          system: balanceByProduct[p.id] ?? '0',
          counted: '1',
        },
      ];
    });
  };

  const onScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const raw = scanRef.current?.value.trim() ?? '';
    if (!raw) return;
    const found = byCode.get(raw.toUpperCase());
    if (!found) setScanError(`No product matches "${raw}"`);
    else {
      setScanError(null);
      addProduct(found);
    }
    if (scanRef.current) scanRef.current.value = '';
    if (!continuous) scanRef.current?.blur();
  };

  const updateCounted = (idx: number, value: string) => {
    setRows((prev) => {
      const copy = [...prev];
      const cur = copy[idx];
      if (cur) copy[idx] = { ...cur, counted: value };
      return copy;
    });
  };
  const removeRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx));

  const withVariance = rows.map((r) => {
    const sys = Number(r.system || 0);
    const cnt = Number(r.counted || 0);
    const variance = cnt - sys;
    return { ...r, variance };
  });

  const itemsJson = JSON.stringify(
    rows.map((r) => ({ productId: r.productId, countedQuantity: r.counted })),
  );

  const hasMismatch = withVariance.some((r) => r.variance !== 0);
  const totalMismatch = withVariance.filter((r) => r.variance !== 0).length;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="branchId" value={branchId} />
      <input type="hidden" name="itemsJson" value={itemsJson} />

      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="warehouseId">Warehouse</Label>
            <select
              id="warehouseId"
              name="warehouseId"
              required
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" name="note" rows={1} placeholder="Optional reason / session info" />
          </div>
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
                placeholder="Scan / type SKU or barcode and press Enter…"
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
                  <th className="text-right font-semibold px-3 py-2">System</th>
                  <th className="text-right font-semibold px-3 py-2">Counted</th>
                  <th className="text-right font-semibold px-3 py-2">Variance</th>
                  <th className="text-right font-semibold px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {withVariance.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground text-sm">
                      Scan items to start counting.
                    </td>
                  </tr>
                )}
                {withVariance.map((r, i) => (
                  <tr key={r.productId}>
                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.sku}</td>
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2 text-right tabular text-muted-foreground">{r.system}</td>
                    <td className="px-3 py-2 text-right">
                      <Input
                        value={r.counted}
                        onChange={(e) => updateCounted(i, e.target.value)}
                        type="text"
                        inputMode="decimal"
                        className="h-8 w-28 text-right tabular ml-auto"
                      />
                    </td>
                    <td
                      className={
                        'px-3 py-2 text-right tabular font-medium ' +
                        (r.variance > 0
                          ? 'text-success'
                          : r.variance < 0
                            ? 'text-destructive'
                            : 'text-muted-foreground')
                      }
                    >
                      {r.variance > 0 ? `+${r.variance}` : r.variance}
                    </td>
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
            </table>
          </div>
          {rows.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {totalMismatch > 0
                ? `${totalMismatch} item(s) will generate adjustment rows on submit.`
                : 'All counted items match the system — no adjustments needed.'}
            </p>
          )}
        </CardContent>
      </Card>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending || rows.length === 0 || !hasMismatch}>
          {pending ? 'Posting…' : hasMismatch ? 'Post adjustments' : 'Nothing to adjust'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/inventory/stock">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
