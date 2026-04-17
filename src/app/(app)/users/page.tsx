import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { userService } from '@/server/services/user.service';
import { setUserStatusAction } from '@/server/actions/users';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Users' };

export default async function UsersPage() {
  const session = await getSession();
  const users = await userService.list(session);
  const canWrite = session?.permissions.includes('users:write') ?? false;

  return (
    <div>
      <PageHeader title="Users" description="System users, their roles, and default branch.">
        {canWrite && (
          <Button asChild>
            <Link href="/users/new">
              <Plus className="h-4 w-4" />
              New user
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
                <th className="text-left font-semibold px-4 py-3">Email</th>
                <th className="text-left font-semibold px-4 py-3">Roles</th>
                <th className="text-left font-semibold px-4 py-3">Branch</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                <th className="text-left font-semibold px-4 py-3">Created</th>
                <th className="text-right font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No users yet.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((ur) => (
                        <Badge key={ur.role.id} variant="secondary">
                          {ur.role.name}
                        </Badge>
                      ))}
                      {u.roles.length === 0 && <span className="text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.defaultBranch?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground tabular">
                    {u.createdAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-3">
                    {canWrite && (
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/users/${u.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <form action={setUserStatusAction}>
                          <input type="hidden" name="id" value={u.id} />
                          <input
                            type="hidden"
                            name="status"
                            value={u.status === 'DISABLED' ? 'ACTIVE' : 'DISABLED'}
                          />
                          <Button size="sm" variant="outline" type="submit">
                            {u.status === 'DISABLED' ? 'Enable' : 'Disable'}
                          </Button>
                        </form>
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
