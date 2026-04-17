import { getSession } from '@/server/auth/session';
import { roleService } from '@/server/services/role.service';
import { PageHeader } from '@/components/shared/page-header';
import { RoleForm } from '../role-form';

export const metadata = { title: 'Edit role' };

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const [role, permissions] = await Promise.all([
    roleService.getById(session, id),
    roleService.listPermissions(session),
  ]);

  return (
    <div>
      <PageHeader title={role.name} description={role.description ?? 'Edit role and permissions.'} />
      <RoleForm
        mode="edit"
        initial={{
          id: role.id,
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
          permissionKeys: role.permissions.map((rp) => rp.permission.key),
        }}
        permissions={permissions}
      />
    </div>
  );
}
