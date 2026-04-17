import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { branchService } from '@/server/services/branch.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Branches' };

export default async function BranchesPage() {
  const session = await getSession();
  const branches = await branchService.listAll(session);
  const canWrite = session?.permissions.includes('branches:write') ?? false;

  return (
    <div>
      <PageHeader title="Branches" description="Physical locations: head office, factories, showrooms, warehouses.">
        {canWrite && (
          <Button asChild>
            <Link href="/branches/new">
              <Plus className="h-4 w-4" />
              New branch
            </Link>
          </Button>
        )}
      </PageHeader>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Code</th>
                <th className="text-left font-semibold px-4 py-3">Name</th>
                <th className="text-left font-semibold px-4 py-3">Type</th>
                <th className="text-left font-semibold px-4 py-3">Currency</th>
                <th className="text-left font-semibold px-4 py-3">Phone</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                <th className="text-right font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {branches.map((b) => (
                <tr key={b.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{b.code}</td>
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{b.type.toLowerCase()}</td>
                  <td className="px-4 py-3 tabular">{b.currency}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={b.isActive ? 'success' : 'outline'}>
                      {b.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {canWrite && (
                      <div className="flex items-center justify-end">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/branches/${b.id}`}>
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
