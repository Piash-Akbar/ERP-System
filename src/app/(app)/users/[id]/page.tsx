import { getSession } from '@/server/auth/session';
import { userService } from '@/server/services/user.service';
import { roleService } from '@/server/services/role.service';
import { branchService } from '@/server/services/branch.service';
import { PageHeader } from '@/components/shared/page-header';
import { UserForm } from '../user-form';

export const metadata = { title: 'Edit user' };

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const [user, roles, branches] = await Promise.all([
    userService.getById(session, id),
    roleService.list(session),
    branchService.listActive(session),
  ]);

  return (
    <div>
      <PageHeader title={user.name} description={user.email} />
      <UserForm
        mode="edit"
        initial={{
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          status: user.status,
          defaultBranchId: user.defaultBranchId,
          roleIds: user.roles.map((ur) => ur.role.id),
        }}
        roles={roles.map((r) => ({ id: r.id, name: r.name, description: r.description }))}
        branches={branches.map((b) => ({ id: b.id, name: b.name, code: b.code }))}
      />
    </div>
  );
}
