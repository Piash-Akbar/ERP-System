import { getSession } from '@/server/auth/session';
import { stockService } from '@/server/services/stock.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Inventory ledger' };

export default async function LedgerPage() {
  const session = await getSession();
  const branchId = session?.activeBranchId ?? undefined;
  const rows = await stockService.listMovements(session, { branchId, limit: 300 });

  return (
    <div>
      <PageHeader
        title="Inventory ledger"
        description="Every stock movement. The single source of truth for stock quantity."
      />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">When</th>
                <th className="text-left font-semibold px-4 py-3">SKU</th>
                <th className="text-left font-semibold px-4 py-3">Product</th>
                <th className="text-left font-semibold px-4 py-3">Warehouse</th>
                <th className="text-left font-semibold px-4 py-3">Dir</th>
                <th className="text-right font-semibold px-4 py-3">Qty</th>
                <th className="text-right font-semibold px-4 py-3">Cost / unit</th>
                <th className="text-left font-semibold px-4 py-3">Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    No movements yet.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground tabular text-xs">
                    {r.createdAt.toISOString().replace('T', ' ').slice(0, 19)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{r.product.sku}</td>
                  <td className="px-4 py-3">{r.product.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.warehouse.name} <span className="text-xs">({r.warehouse.code})</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={r.direction === 'IN' ? 'success' : 'destructive'}>
                      {r.direction}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular font-medium">{r.quantity.toString()}</td>
                  <td className="px-4 py-3 text-right tabular text-muted-foreground">
                    {r.costPerUnit.toString()}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="font-mono text-muted-foreground">{r.refType}</span>
                    {r.refId && <span className="ml-1 text-muted-foreground">· {r.refId}</span>}
                    {r.note && <div className="text-muted-foreground mt-0.5">{r.note}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
