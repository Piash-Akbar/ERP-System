import { getSession } from '@/server/auth/session';
import { roleService } from '@/server/services/role.service';
import { PageHeader } from '@/components/shared/page-header';
import { RoleForm } from '../role-form';

export const metadata = { title: 'New role' };

export default async function NewRolePage() {
  const session = await getSession();
  const permissions = await roleService.listPermissions(session);
  return (
    <div>
      <PageHeader title="New role" description="Define a new role and choose its permissions." />
      <RoleForm mode="create" permissions={permissions} />
    </div>
  );
}
