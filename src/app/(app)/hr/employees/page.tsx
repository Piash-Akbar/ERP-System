import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { hrService } from '@/server/services/hr.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Employees' };

const STATUS_VARIANT: Record<string, 'default' | 'outline' | 'success' | 'warning' | 'destructive'> = {
  ACTIVE: 'success',
  ON_LEAVE: 'warning',
  TERMINATED: 'destructive',
  RESIGNED: 'outline',
};

export default async function EmployeesPage() {
  const session = await getSession();
  const employees = await hrService.listEmployees(session);
  const canWrite = session?.permissions.includes('hr:write') ?? false;

  return (
    <div>
      <PageHeader title="Employees" description="All staff on the payroll.">
        {canWrite && (
          <Button asChild>
            <Link href="/hr/employees/new">
              <Plus className="h-4 w-4" />
              New employee
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
                <th className="text-left font-semibold px-4 py-3">Designation</th>
                <th className="text-left font-semibold px-4 py-3">Department</th>
                <th className="text-left font-semibold px-4 py-3">Branch</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Basic</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                <th className="text-right font-semibold px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {employees.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No employees yet.
                  </td>
                </tr>
              )}
              {employees.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{e.code}</td>
                  <td className="px-4 py-3 font-medium">{e.firstName} {e.lastName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.designation ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.department ?? '—'}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{e.branch.code}</Badge></td>
                  <td className="px-4 py-3 text-right tabular-nums">{e.basicSalary.toString()}</td>
                  <td className="px-4 py-3"><Badge variant={STATUS_VARIANT[e.status] ?? 'outline'}>{e.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    {canWrite && (
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/hr/employees/${e.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
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
