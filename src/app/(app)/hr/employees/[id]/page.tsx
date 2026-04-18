import { notFound } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { authorize } from '@/server/auth/authorize';
import { hrService } from '@/server/services/hr.service';
import { branchService } from '@/server/services/branch.service';
import { PageHeader } from '@/components/shared/page-header';
import { EmployeeForm } from '../_components/employee-form';
import { NotFoundError } from '@/lib/errors';

export const metadata = { title: 'Edit employee' };

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  await authorize(session, 'hr:write');
  let employee;
  try {
    employee = await hrService.getEmployee(session, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
  const branches = await branchService.listActive(session);
  return (
    <div>
      <PageHeader title={`${employee.firstName} ${employee.lastName}`} description={`${employee.code} · ${employee.designation ?? '—'}`} />
      <EmployeeForm
        mode="edit"
        branches={branches.map((b) => ({ id: b.id, code: b.code, name: b.name }))}
        initial={{
          id: employee.id,
          branchId: employee.branchId,
          code: employee.code,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          designation: employee.designation,
          department: employee.department,
          joinedAt: employee.joinedAt.toISOString().slice(0, 10),
          status: employee.status,
          basicSalary: employee.basicSalary.toString(),
          houseAllowance: employee.houseAllowance.toString(),
          transportAllowance: employee.transportAllowance.toString(),
          medicalAllowance: employee.medicalAllowance.toString(),
          otherAllowance: employee.otherAllowance.toString(),
          providentFund: employee.providentFund.toString(),
          taxDeduction: employee.taxDeduction.toString(),
          bankName: employee.bankName,
          bankAccount: employee.bankAccount,
        }}
      />
    </div>
  );
}
