import Link from 'next/link';
import { Users, CalendarCheck, CalendarOff, Banknote } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = { title: 'HR & Payroll' };

export default function HrOverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="HR & Payroll" description="Employees, attendance, leave, and monthly payroll." />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NavCard icon={<Users className="h-5 w-5 text-primary" />} title="Employees" subtitle="Profiles & salary structure" href="/hr/employees" />
        <NavCard icon={<CalendarCheck className="h-5 w-5 text-primary" />} title="Attendance" subtitle="Daily check-in / out" href="/hr/attendance" />
        <NavCard icon={<CalendarOff className="h-5 w-5 text-primary" />} title="Leaves" subtitle="Requests & approvals" href="/hr/leaves" />
        <NavCard icon={<Banknote className="h-5 w-5 text-primary" />} title="Payroll" subtitle="Monthly runs & payslips" href="/hr/payroll" />
      </div>
    </div>
  );
}

function NavCard({ icon, title, subtitle, href }: { icon: React.ReactNode; title: string; subtitle: string; href: string }) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary transition-colors">
        <CardContent className="p-5 flex items-start gap-3">
          <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">{icon}</div>
          <div>
            <div className="font-semibold text-sm">{title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
