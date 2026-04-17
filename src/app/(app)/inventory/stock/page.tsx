import Link from 'next/link';
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { stockService } from '@/server/services/stock.service';
import { warehouseService } from '@/server/services/warehouse.service';
import { prisma } from '@/server/db';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Stock balance' };

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
      select: { id: true, sku: true, name: true, unit: true, reorderLevel: true },
    }),
  ]);

  const whById = new Map(warehouses.map((w) => [w.id, w]));
  const prodById = new Map(products.map((p) => [p.id, p]));

  // Rows sorted by product then warehouse
  const rows = balances
    .map((b) => ({
      product: prodById.get(b.productId),
      warehouse: whById.get(b.warehouseId),
      qty: b.balance,
    }))
    .filter((r) => r.product && r.warehouse)
    .sort((a, b) => {
      const pa = a.product!.name.localeCompare(b.product!.name);
      if (pa !== 0) return pa;
      return a.warehouse!.name.localeCompare(b.warehouse!.name);
    });

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
                <th className="text-right font-semibold px-4 py-3">Reorder level</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No stock movements yet. Post a receipt to see balances.
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const low =
                  r.product!.reorderLevel.gt(0) && r.qty.lte(r.product!.reorderLevel)
                    ? 'text-warning'
                    : r.qty.lte(0)
                      ? 'text-destructive'
                      : '';
                return (
                  <tr key={`${r.product!.id}-${r.warehouse!.id}`} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{r.product!.sku}</td>
                    <td className="px-4 py-3 font-medium">{r.product!.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.warehouse!.name}{' '}
                      <span className="text-xs">({r.warehouse!.code})</span>
                    </td>
                    <td className={`px-4 py-3 text-right tabular font-semibold ${low}`}>
                      {r.qty.toString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.product!.unit}</td>
                    <td className="px-4 py-3 text-right tabular text-muted-foreground">
                      {r.product!.reorderLevel.gt(0) ? r.product!.reorderLevel.toString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
