import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/server/auth/session';
import { hrService } from '@/server/services/hr.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { payrollStatusAction } from '@/server/actions/hr';
import { NotFoundError } from '@/lib/errors';

export const metadata = { title: 'Payroll run' };

const STATUS_VARIANT: Record<string, 'default' | 'outline' | 'success' | 'warning' | 'destructive'> = {
  DRAFT: 'warning',
  APPROVED: 'default',
  PAID: 'success',
  LOCKED: 'outline',
  CANCELLED: 'destructive',
};

export default async function PayrollRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  let run;
  try {
    run = await hrService.getPayrollRun(session, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
  const canApprove = session?.permissions.includes('hr:approve-payroll') ?? false;
  const canPay = session?.permissions.includes('hr:pay-payroll') ?? false;
  const canLock = session?.permissions.includes('hr:lock-payroll') ?? false;
  const canCancel = session?.permissions.includes('hr:process-payroll') ?? false;

  return (
    <div className="space-y-6">
      <PageHeader title={`Payroll · ${run.period}`} description={`${run.branch.name} · ${run.payslips.length} employees`}>
        <Badge variant={STATUS_VARIANT[run.status] ?? 'outline'}>{run.status}</Badge>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard label="Total gross" value={run.totalGross.toString()} />
        <SummaryCard label="Total deduction" value={run.totalDeduction.toString()} />
        <SummaryCard label="Total net payable" value={run.totalNet.toString()} accent />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Code</th>
                <th className="text-left font-semibold px-4 py-3">Employee</th>
                <th className="text-right font-semibold px-4 py-3">Worked</th>
                <th className="text-right font-semibold px-4 py-3">Leave</th>
                <th className="text-right font-semibold px-4 py-3">Absent</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Basic</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Allowances</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Gross</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Deduction</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {run.payslips.map((p) => {
                const allowances = p.houseAllowance.plus(p.transportAllowance).plus(p.medicalAllowance).plus(p.otherAllowance);
                const deduction = p.providentFund.plus(p.taxDeduction).plus(p.otherDeduction);
                return (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2 font-mono text-xs">{p.employee.code}</td>
                    <td className="px-4 py-2">{p.employee.firstName} {p.employee.lastName}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{p.workedDays}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{p.leaveDays}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{p.absentDays}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{p.basic.toString()}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{allowances.toString()}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{p.gross.toString()}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{deduction.toString()}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-semibold">{p.net.toString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-2">
          {run.status === 'DRAFT' && canApprove && (
            <ActionForm id={run.id} action="approve" label="Approve" />
          )}
          {run.status === 'APPROVED' && canPay && (
            <ActionForm id={run.id} action="pay" label="Mark as paid" />
          )}
          {run.status === 'PAID' && canLock && (
            <ActionForm id={run.id} action="lock" label="Lock run" />
          )}
          {run.status === 'DRAFT' && canCancel && (
            <ActionForm id={run.id} action="cancel" label="Cancel & delete" danger />
          )}
          <Button variant="ghost" asChild>
            <Link href="/hr/payroll">Back</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`text-2xl font-semibold tabular-nums mt-1 ${accent ? 'text-primary' : ''}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function ActionForm({ id, action, label, danger }: { id: string; action: string; label: string; danger?: boolean }) {
  return (
    <form action={payrollStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value={action} />
      <Button type="submit" variant={danger ? 'destructive' : 'default'}>{label}</Button>
    </form>
  );
}
