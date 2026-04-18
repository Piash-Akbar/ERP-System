import Link from 'next/link';
import { getSession } from '@/server/auth/session';
import { hrService } from '@/server/services/hr.service';
import { branchService } from '@/server/services/branch.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NewPayrollRunForm } from './_components/new-run-form';

export const metadata = { title: 'Payroll' };

const STATUS_VARIANT: Record<string, 'default' | 'outline' | 'success' | 'warning' | 'destructive'> = {
  DRAFT: 'warning',
  APPROVED: 'default',
  PAID: 'success',
  LOCKED: 'outline',
  CANCELLED: 'destructive',
};

export default async function PayrollPage() {
  const session = await getSession();
  const [runs, branches] = await Promise.all([
    hrService.listPayrollRuns(session),
    branchService.listActive(session),
  ]);
  const canProcess = session?.permissions.includes('hr:process-payroll') ?? false;

  return (
    <div className="space-y-6">
      <PageHeader title="Payroll" description="Monthly payroll runs. Each run generates a payslip per employee." />

      {canProcess && (
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-semibold mb-3">Start a new payroll run</div>
            <NewPayrollRunForm
              branches={branches.map((b) => ({ id: b.id, code: b.code, name: b.name }))}
            />
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Period</th>
                <th className="text-left font-semibold px-4 py-3">Branch</th>
                <th className="text-right font-semibold px-4 py-3">Employees</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Gross</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Deduction</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Net</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {runs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No payroll runs yet.
                  </td>
                </tr>
              )}
              {runs.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link href={`/hr/payroll/${r.id}`} className="text-primary hover:underline">{r.period}</Link>
                  </td>
                  <td className="px-4 py-3"><Badge variant="outline">{r.branch.code}</Badge></td>
                  <td className="px-4 py-3 text-right tabular-nums">{r._count.payslips}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.totalGross.toString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.totalDeduction.toString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">{r.totalNet.toString()}</td>
                  <td className="px-4 py-3"><Badge variant={STATUS_VARIANT[r.status] ?? 'outline'}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
