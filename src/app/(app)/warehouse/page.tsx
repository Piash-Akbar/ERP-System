import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { warehouseService } from '@/server/services/warehouse.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Warehouses' };

export default async function WarehousesPage() {
  const session = await getSession();
  const warehouses = await warehouseService.listAll(session);
  const canWrite = session?.permissions.includes('inventory:write') ?? false;

  return (
    <div>
      <PageHeader title="Warehouses" description="Physical stock locations. Goods flow through these for receive / issue / transfer.">
        {canWrite && (
          <Button asChild>
            <Link href="/warehouse/new">
              <Plus className="h-4 w-4" />
              New warehouse
            </Link>
          </Button>
        )}
      </PageHeader>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Branch</th>
                <th className="text-left font-semibold px-4 py-3">Code</th>
                <th className="text-left font-semibold px-4 py-3">Name</th>
                <th className="text-left font-semibold px-4 py-3">Type</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                <th className="text-right font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {warehouses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No warehouses yet.
                  </td>
                </tr>
              )}
              {warehouses.map((w) => (
                <tr key={w.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <span className="font-medium">{w.branch.name}</span>{' '}
                    <span className="text-xs text-muted-foreground">({w.branch.code})</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{w.code}</td>
                  <td className="px-4 py-3 font-medium">{w.name}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{w.type.toLowerCase()}</td>
                  <td className="px-4 py-3">
                    <Badge variant={w.isActive ? 'success' : 'outline'}>
                      {w.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {canWrite && (
                      <div className="flex items-center justify-end">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/warehouse/${w.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    )}
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
