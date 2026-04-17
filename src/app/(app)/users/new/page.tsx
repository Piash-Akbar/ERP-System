import { getSession } from '@/server/auth/session';
import { roleService } from '@/server/services/role.service';
import { branchService } from '@/server/services/branch.service';
import { PageHeader } from '@/components/shared/page-header';
import { UserForm } from '../user-form';

export const metadata = { title: 'New user' };

export default async function NewUserPage() {
  const session = await getSession();
  const [roles, branches] = await Promise.all([
    roleService.list(session),
    branchService.listActive(session),
  ]);

  return (
    <div>
      <PageHeader title="New user" description="Create a system user." />
      <UserForm
        mode="create"
        roles={roles.map((r) => ({ id: r.id, name: r.name, description: r.description }))}
        branches={branches.map((b) => ({ id: b.id, name: b.name, code: b.code }))}
      />
    </div>
  );
}
