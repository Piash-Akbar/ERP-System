import { getSession } from '@/server/auth/session';
import { authorize } from '@/server/auth/authorize';
import { branchService } from '@/server/services/branch.service';
import { PageHeader } from '@/components/shared/page-header';
import { EmployeeForm } from '../_components/employee-form';

export const metadata = { title: 'New employee' };

export default async function NewEmployeePage() {
  const session = await getSession();
  await authorize(session, 'hr:write');
  const branches = await branchService.listActive(session);
  return (
    <div>
      <PageHeader title="New employee" description="Create an employee profile with salary structure." />
      <EmployeeForm mode="create" branches={branches.map((b) => ({ id: b.id, code: b.code, name: b.name }))} />
    </div>
  );
}
