import Link from 'next/link';
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight } from 'lucide-react';
import type { Prisma } from '@prisma/client';
import { getSession } from '@/server/auth/session';
import { stockService } from '@/server/services/stock.service';
import { warehouseService } from '@/server/services/warehouse.service';
import { prisma } from '@/server/db';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/money';

export const metadata = { title: 'Stock balance' };

type Product = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  type: import('@prisma/client').ProductType;
  reorderLevel: Prisma.Decimal;
  costPrice: Prisma.Decimal;
  sellPrice: Prisma.Decimal;
};
type Warehouse = { id: string; name: string; code: string };
type Row = { product: Product; warehouse: Warehouse; qty: Prisma.Decimal };

export default async function StockBalancePage() {
  const session = await getSession();
  const branchId = session?.activeBranchId;

  if (!branchId) {
    return (
      <div>
        <PageHeader title="Stock balance" />
        <Card className="p-6 text-sm text-muted-foreground">
          Select an active branch from the topbar first.
        </Card>
      </div>
    );
  }

  const [balances, warehouses, products] = await Promise.all([
    stockService.balanceSnapshot(session, branchId),
    warehouseService.listActiveForBranch(session, branchId),
    prisma.product.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, sku: true, name: true, unit: true, reorderLevel: true, type: true, costPrice: true, sellPrice: true },
    }),
  ]);

  const whById = new Map(warehouses.map((w) => [w.id, w]));
  const prodById = new Map(products.map((p) => [p.id, p]));

  const allRows: Row[] = [];
  for (const b of balances) {
    const product = prodById.get(b.productId);
    const warehouse = whById.get(b.warehouseId);
    if (!product || !warehouse) continue;
    allRows.push({ product, warehouse: { id: warehouse.id, name: warehouse.name, code: warehouse.code }, qty: b.balance });
  }
  allRows.sort((a, b) => {
    const pa = a.product.name.localeCompare(b.product.name);
    if (pa !== 0) return pa;
    return a.warehouse.name.localeCompare(b.warehouse.name);
  });

  const finishedRows = allRows.filter((r) => r.product.type === 'FINISHED_GOOD');
  const rawRows = allRows.filter((r) => r.product.type === 'RAW_MATERIAL');
  const otherRows = allRows.filter(
    (r) => r.product.type !== 'FINISHED_GOOD' && r.product.type !== 'RAW_MATERIAL',
  );

  return (
    <div>
      <PageHeader title="Stock balance" description="Live balance per warehouse, derived from the inventory ledger.">
        <Button variant="outline" asChild>
          <Link href="/warehouse/receive">
            <ArrowDownToLine className="h-4 w-4" />
            Receive
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/warehouse/issue">
            <ArrowUpFromLine className="h-4 w-4" />
            Issue
          </Link>
        </Button>
        <Button asChild>
          <Link href="/warehouse/transfer">
            <ArrowLeftRight className="h-4 w-4" />
            Transfer
          </Link>
        </Button>
      </PageHeader>

      <div className="space-y-6">
        <StockSection
          title="Finished products"
          description="Sellable finished goods produced in the factory or received for resale."
          rows={finishedRows}
          emptyLabel="No finished-goods stock yet."
        />
        <StockSection
          title="Raw materials"
          description="Materials and inputs consumed in production."
          rows={rawRows}
          emptyLabel="No raw-material stock yet."
        />
        {otherRows.length > 0 && (
          <StockSection
            title="Other"
            description="Work-in-progress, consumables, and other stock items."
            rows={otherRows}
            emptyLabel="No other stock."
          />
        )}
      </div>
    </div>
  );
}

function StockSection({
  title,
  description,
  rows,
  emptyLabel,
}: {
  title: string;
  description: string;
  rows: Row[];
  emptyLabel: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <span className="text-xs text-muted-foreground">
          {rows.length} {rows.length === 1 ? 'row' : 'rows'}
        </span>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">SKU</th>
                <th className="text-left font-semibold px-4 py-3">Product</th>
                <th className="text-left font-semibold px-4 py-3">Warehouse</th>
                <th className="text-right font-semibold px-4 py-3">Balance</th>
                <th className="text-left font-semibold px-4 py-3">Unit</th>
                <th className="text-right font-semibold px-4 py-3">Buy / unit</th>
                <th className="text-right font-semibold px-4 py-3">Sell / unit</th>
                <th className="text-right font-semibold px-4 py-3">Total Cost</th>
                <th className="text-right font-semibold px-4 py-3">Total Sell</th>
                <th className="text-right font-semibold px-4 py-3">Reorder level</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">
                    {emptyLabel}
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const low =
                  r.product.reorderLevel.gt(0) && r.qty.lte(r.product.reorderLevel)
                    ? 'text-warning'
                    : r.qty.lte(0)
                      ? 'text-destructive'
                      : '';
                const totalCost = r.product.costPrice.mul(r.qty);
                const totalSell = r.product.sellPrice.mul(r.qty);
                return (
                  <tr key={`${r.product.id}-${r.warehouse.id}`} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{r.product.sku}</td>
                    <td className="px-4 py-3 font-medium">{r.product.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.warehouse.name} <span className="text-xs">({r.warehouse.code})</span>
                    </td>
                    <td className={`px-4 py-3 text-right tabular-nums font-semibold ${low}`}>
                      {r.qty.toString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.product.unit}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {formatCurrency(r.product.costPrice)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {formatCurrency(r.product.sellPrice)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {formatCurrency(totalCost)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {formatCurrency(totalSell)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {r.product.reorderLevel.gt(0) ? r.product.reorderLevel.toString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
