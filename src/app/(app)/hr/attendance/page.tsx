import { getSession } from '@/server/auth/session';
import { hrService } from '@/server/services/hr.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { markAttendanceAction } from '@/server/actions/hr';
import { ATTENDANCE_STATUSES } from '@/server/validators/hr';

export const metadata = { title: 'Attendance' };

const STATUS_VARIANT: Record<string, 'default' | 'outline' | 'success' | 'warning' | 'destructive'> = {
  PRESENT: 'success',
  LATE: 'warning',
  HALF_DAY: 'warning',
  ABSENT: 'destructive',
  ON_LEAVE: 'default',
  HOLIDAY: 'outline',
};

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const dateStr = sp.date ?? new Date().toISOString().slice(0, 10);
  const day = new Date(dateStr);
  const session = await getSession();
  const [employees, records] = await Promise.all([
    hrService.listEmployees(session, { status: 'ACTIVE' }),
    hrService.listAttendance(session, { from: day, to: day }),
  ]);
  const canMark = session?.permissions.includes('hr:attendance') ?? false;
  const byEmp = new Map(records.map((r) => [r.employeeId, r]));

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" description={`Daily attendance for ${dateStr}`}>
        <form className="flex items-center gap-2">
          <input
            type="date"
            name="date"
            defaultValue={dateStr}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          />
          <Button type="submit" variant="outline">Go</Button>
        </form>
      </PageHeader>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Code</th>
                <th className="text-left font-semibold px-4 py-3">Employee</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                {canMark && <th className="text-left font-semibold px-4 py-3">Mark</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {employees.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No active employees.
                  </td>
                </tr>
              )}
              {employees.map((e) => {
                const r = byEmp.get(e.id);
                return (
                  <tr key={e.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{e.code}</td>
                    <td className="px-4 py-3 font-medium">{e.firstName} {e.lastName}</td>
                    <td className="px-4 py-3">
                      {r ? (
                        <Badge variant={STATUS_VARIANT[r.status] ?? 'outline'}>{r.status}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not marked</span>
                      )}
                    </td>
                    {canMark && (
                      <td className="px-4 py-3">
                        <form action={markAttendanceAction} className="flex items-center gap-2">
                          <input type="hidden" name="employeeId" value={e.id} />
                          <input type="hidden" name="date" value={dateStr} />
                          <select
                            name="status"
                            defaultValue={r?.status ?? 'PRESENT'}
                            className="flex h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                          >
                            {ATTENDANCE_STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <Button type="submit" size="sm" variant="outline">Save</Button>
                        </form>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {canMark && (
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-semibold mb-3">Detailed check-in / check-out</div>
            <form action={markAttendanceAction} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="employeeId">Employee</Label>
                <select id="employeeId" name="employeeId" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.code} · {e.firstName} {e.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" type="date" defaultValue={dateStr} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkIn">Check-in</Label>
                <Input id="checkIn" name="checkIn" type="time" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOut">Check-out</Label>
                <Input id="checkOut" name="checkOut" type="time" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="statusDetail">Status</Label>
                <select id="statusDetail" name="status" defaultValue="PRESENT" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                  {ATTENDANCE_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-6">
                <Button type="submit">Save attendance</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
