import Link from 'next/link';
import { getSession } from '@/server/auth/session';
import { reportsService } from '@/server/services/reports.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'HR report' };

export default async function HrReportPage() {
  const session = await getSession();
  const data = await reportsService.hrSummary(session);

  return (
    <div className="space-y-6">
      <PageHeader title="HR summary" description="Headcount and latest payroll run." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Kpi label="Active" value={`${data.headcount.active}`} accent />
        <Kpi label="On leave" value={`${data.headcount.onLeave}`} />
        <Kpi label="Terminated" value={`${data.headcount.terminated}`} />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-sm font-semibold mb-4">Last payroll run</div>
          {data.lastPayroll ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <Field label="Period" value={
                <Link href={`/hr/payroll/${data.lastPayroll.id}`} className="text-primary hover:underline">
                  {data.lastPayroll.period}
                </Link>
              } />
              <Field label="Branch" value={<Badge variant="outline">{data.lastPayroll.branch}</Badge>} />
              <Field label="Status" value={<Badge variant="success">{data.lastPayroll.status}</Badge>} />
              <div />
              <Field label="Total gross" value={data.lastPayroll.gross.toString()} />
              <Field label="Total deduction" value={data.lastPayroll.deduction.toString()} />
              <Field label="Total net paid" value={<span className="font-semibold text-primary">{data.lastPayroll.net.toString()}</span>} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No approved payroll runs yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`text-2xl font-semibold tabular-nums mt-1 ${accent ? 'text-primary' : ''}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 tabular-nums">{value}</div>
    </div>
  );
}
