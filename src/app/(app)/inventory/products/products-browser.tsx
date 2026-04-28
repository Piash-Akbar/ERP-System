'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Pencil, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/money';

export type ProductRow = {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  unit: string;
  costPrice: string;
  sellPrice: string;
  reorderLevel: string;
  availableQty: string;
  isActive: boolean;
  category: { id: string; name: string } | null;
};

const UNCATEGORIZED_KEY = '__uncategorized__';
const UNCATEGORIZED_LABEL = 'Uncategorized';

export function ProductsBrowser({ products, canWrite }: { products: ProductRow[]; canWrite: boolean }) {
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? products.filter((p) => {
          const catName = p.category?.name.toLowerCase() ?? '';
          return (
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            (p.barcode?.toLowerCase().includes(q) ?? false) ||
            catName.includes(q)
          );
        })
      : products;

    const map = new Map<string, { key: string; name: string; items: ProductRow[] }>();
    for (const p of filtered) {
      const key = p.category?.id ?? UNCATEGORIZED_KEY;
      const name = p.category?.name ?? UNCATEGORIZED_LABEL;
      let bucket = map.get(key);
      if (!bucket) {
        bucket = { key, name, items: [] };
        map.set(key, bucket);
      }
      bucket.items.push(p);
    }

    const sorted = Array.from(map.values()).sort((a, b) => {
      if (a.key === UNCATEGORIZED_KEY) return 1;
      if (b.key === UNCATEGORIZED_KEY) return -1;
      return a.name.localeCompare(b.name);
    });
    for (const g of sorted) {
      g.items.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [products, query]);

  const totalShown = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, SKU, barcode, or category…"
            className="pl-8"
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {totalShown} of {products.length}
        </span>
      </div>

      {groups.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          {products.length === 0 ? 'No products yet. Create one to get started.' : 'No products match your search.'}
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <Card key={group.key} className="overflow-hidden">
              <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{group.name}</h3>
                  <Badge variant="outline" className="text-xs">{group.items.length}</Badge>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left font-semibold px-4 py-2">SKU</th>
                      <th className="text-left font-semibold px-4 py-2">Name</th>
                      <th className="text-left font-semibold px-4 py-2">Unit</th>
                      <th className="text-right font-semibold px-4 py-2">Buy / unit</th>
                      <th className="text-right font-semibold px-4 py-2">Sell / unit</th>
                      <th className="text-right font-semibold px-4 py-2">Available</th>
                      <th className="text-right font-semibold px-4 py-2">Total Cost</th>
                      <th className="text-right font-semibold px-4 py-2">Total Sell</th>
                      <th className="text-left font-semibold px-4 py-2">Status</th>
                      <th className="text-right font-semibold px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {group.items.map((p) => {
                      const qty = parseFloat(p.availableQty);
                      const reorder = parseFloat(p.reorderLevel);
                      const costPerUnit = parseFloat(p.costPrice);
                      const sellPerUnit = parseFloat(p.sellPrice);
                      const totalCost = costPerUnit * qty;
                      const totalSell = sellPerUnit * qty;
                      const isLow = qty <= reorder && reorder > 0;
                      const isOut = qty <= 0;
                      return (
                      <tr key={p.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                        <td className="px-4 py-3 font-medium">{p.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{p.unit}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(costPerUnit)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(sellPerUnit)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className={isOut ? 'text-red-500 font-semibold' : isLow ? 'text-amber-500 font-semibold' : 'text-emerald-600 font-semibold'}>
                            {qty % 1 === 0 ? qty.toFixed(0) : qty.toFixed(2)} {p.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {formatCurrency(totalCost)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">
                          {formatCurrency(totalSell)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={p.isActive ? 'success' : 'outline'}>
                            {p.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {canWrite && (
                            <div className="flex items-center justify-end">
                              <Button size="sm" variant="ghost" asChild>
                                <Link href={`/inventory/products/${p.id}`}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
