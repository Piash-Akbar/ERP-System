import Link from 'next/link';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { roleService } from '@/server/services/role.service';
import { deleteRoleAction } from '@/server/actions/roles';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Roles' };

export default async function RolesPage() {
  const session = await getSession();
  const roles = await roleService.list(session);
  const canWrite = session?.permissions.includes('roles:write') ?? false;
  const canDelete = session?.permissions.includes('roles:delete') ?? false;

  return (
    <div>
      <PageHeader title="Roles" description="Roles bundle permissions. Assign roles to users to grant access.">
        {canWrite && (
          <Button asChild>
            <Link href="/roles/new">
              <Plus className="h-4 w-4" />
              New role
            </Link>
          </Button>
        )}
      </PageHeader>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Name</th>
                <th className="text-left font-semibold px-4 py-3">Description</th>
                <th className="text-left font-semibold px-4 py-3">Users</th>
                <th className="text-left font-semibold px-4 py-3">Permissions</th>
                <th className="text-right font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {roles.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium flex items-center gap-2">
                    {r.name}
                    {r.isSystem && <Badge variant="outline">system</Badge>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-md truncate">
                    {r.description ?? '—'}
                  </td>
                  <td className="px-4 py-3 tabular">{r._count.users}</td>
                  <td className="px-4 py-3 tabular">{r.permissions.length}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {canWrite && (
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/roles/${r.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      )}
                      {canDelete && !r.isSystem && r._count.users === 0 && (
                        <form action={deleteRoleAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <Button size="sm" variant="outline" type="submit">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </form>
                      )}
                    </div>
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
