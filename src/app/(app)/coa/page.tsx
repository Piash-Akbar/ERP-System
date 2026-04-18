import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { coaService } from '@/server/services/coa.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Chart of Accounts' };

const TYPE_VARIANT: Record<string, 'default' | 'outline' | 'success' | 'warning' | 'destructive'> = {
  ASSET: 'success',
  LIABILITY: 'warning',
  EQUITY: 'default',
  INCOME: 'success',
  EXPENSE: 'destructive',
};

export default async function CoaPage() {
  const session = await getSession();
  const accounts = await coaService.tree(session);
  const canWrite = session?.permissions.includes('coa:write') ?? false;

  return (
    <div>
      <PageHeader
        title="Chart of Accounts"
        description="Hierarchical ledger accounts — grouped by type, used by every journal entry."
      >
        {canWrite && (
          <Button asChild>
            <Link href="/coa/new">
              <Plus className="h-4 w-4" />
              New account
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
                <th className="text-left font-semibold px-4 py-3">Side</th>
                <th className="text-left font-semibold px-4 py-3">Role</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Opening</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                <th className="text-right font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {accounts.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={8}>
                    No accounts yet. Create a root account to get started.
                  </td>
                </tr>
              )}
              {accounts.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">
                    <span style={{ paddingLeft: `${a.depth * 16}px` }}>{a.code}</span>
                  </td>
                  <td className="px-4 py-3 font-medium">{a.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant={TYPE_VARIANT[a.type] ?? 'outline'}>{a.type}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.normalSide}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {a.isControl ? 'Control' : a.isPosting ? 'Posting' : 'Header'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {a.openingBalance.toString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={a.isActive ? 'success' : 'outline'}>
                      {a.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {canWrite && (
                      <div className="flex items-center justify-end">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/coa/${a.id}`}>
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
