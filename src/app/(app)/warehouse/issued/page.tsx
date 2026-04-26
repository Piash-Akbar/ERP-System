import Link from 'next/link';
import { Suspense } from 'react';
import { Plus, PackageMinus, Boxes, DollarSign, FileText } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { stockService } from '@/server/services/stock.service';
import { warehouseService } from '@/server/services/warehouse.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IssueLogFilters } from './issue-log-filters';
import { Prisma } from '@prisma/client';

export const metadata = { title: 'Issued Products' };

interface SearchParams {
  warehouseId?: string;
  refType?: string;
  from?: string;
  to?: string;
}

function parseDate(val: string | undefined, endOfDay = false): Date | undefined {
  if (!val) return undefined;
  const d = new Date(val);
  if (isNaN(d.getTime())) return undefined;
  if (endOfDay) d.setHours(23, 59, 59, 999);
  return d;
}

export default async function IssuedProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const branchId = session?.activeBranchId ?? undefined;

  const [warehouses, rows] = await Promise.all([
    branchId ? warehouseService.listActiveForBranch(session, branchId) : Promise.resolve([]),
    stockService.listMovements(session, {
      branchId,
      direction: 'OUT',
      warehouseId: params.warehouseId || undefined,
      refType: params.refType || undefined,
      from: parseDate(params.from),
      to: parseDate(params.to, true),
      limit: 500,
    }),
  ]);

  const totalQty = rows.reduce((sum, r) => sum.add(r.quantity), new Prisma.Decimal(0));
  const totalValue = rows.reduce(
    (sum, r) => sum.add(r.quantity.mul(r.costPerUnit)),
    new Prisma.Decimal(0),
  );
  const uniqueProducts = new Set(rows.map((r) => r.productId)).size;

  return (
    <div>
      <PageHeader
        title="Issued Products"
        description="All outbound stock movements from warehouses."
      >
        <Button asChild>
          <Link href="/warehouse/issue">
            <Plus className="h-4 w-4" />
            New issue
          </Link>
        </Button>
      </PageHeader>

      {/* KPI summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Total records
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-semibold tabular-nums">{rows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <PackageMinus className="h-3.5 w-3.5" />
              Total qty issued
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-semibold tabular-nums">{totalQty.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Boxes className="h-3.5 w-3.5" />
              Unique products
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-semibold tabular-nums">{uniqueProducts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              Total cost value
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-semibold tabular-nums">{totalValue.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <Suspense>
          <IssueLogFilters warehouses={warehouses.map((w) => ({ id: w.id, name: w.name, code: w.code }))} />
        </Suspense>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Date / Time</th>
                <th className="text-left font-semibold px-4 py-3">SKU</th>
                <th className="text-left font-semibold px-4 py-3">Product</th>
                <th className="text-left font-semibold px-4 py-3">Warehouse</th>
                <th className="text-right font-semibold px-4 py-3">Qty</th>
                <th className="text-right font-semibold px-4 py-3">Cost / unit</th>
                <th className="text-right font-semibold px-4 py-3">Total value</th>
                <th className="text-left font-semibold px-4 py-3">Type</th>
                <th className="text-left font-semibold px-4 py-3">Note / Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    No issued products found.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                    {r.createdAt.toISOString().replace('T', ' ').slice(0, 19)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{r.product.sku}</td>
                  <td className="px-4 py-3 font-medium">{r.product.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.warehouse.name}{' '}
                    <span className="text-xs">({r.warehouse.code})</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-red-600">
                    -{r.quantity.toFixed(2)}{' '}
                    <span className="text-xs text-muted-foreground">{r.product.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {r.costPerUnit.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {r.quantity.mul(r.costPerUnit).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <RefTypeBadge refType={r.refType} />
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {r.refId && (
                      <span className="font-mono text-muted-foreground">{r.refId}</span>
                    )}
                    {r.note && (
                      <p className="text-muted-foreground mt-0.5 max-w-[200px] truncate">
                        {r.note}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {rows.length >= 500 && (
        <p className="mt-3 text-xs text-center text-muted-foreground">
          Showing first 500 records. Use filters to narrow the results.
        </p>
      )}
    </div>
  );
}

function RefTypeBadge({ refType }: { refType: string }) {
  const map: Record<string, { label: string; variant: 'destructive' | 'warning' | 'outline' | 'secondary' }> = {
    SALE: { label: 'Sale', variant: 'destructive' },
    DAMAGE: { label: 'Damage', variant: 'warning' },
    MANUAL_ADJUST: { label: 'Manual', variant: 'outline' },
    PRODUCTION: { label: 'Production', variant: 'secondary' },
    TRANSFER: { label: 'Transfer', variant: 'secondary' },
  };
  const cfg = map[refType];
  if (!cfg) return <Badge variant="outline">{refType}</Badge>;
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
