import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { authorize } from '@/server/auth/authorize';
import { recordAudit } from '@/server/audit/logger';
import type { AppSession } from '@/server/auth/session';
import { NotFoundError, ValidationError } from '@/lib/errors';
import type {
  AttendanceMarkInput,
  EmployeeCreateInput,
  EmployeeUpdateInput,
  LeaveCreateInput,
  LeaveDecisionInput,
  PayrollRunCreateInput,
} from '@/server/validators/hr';

const ZERO = new Prisma.Decimal(0);
const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

function parseTimeOn(dateStr: string, hhmm: string): Date | null {
  if (!hhmm) return null;
  const parts = hhmm.split(':');
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const d = new Date(dateStr);
  d.setHours(h, m, 0, 0);
  return d;
}

function daysInclusive(from: Date, to: Date) {
  const ms = 1000 * 60 * 60 * 24;
  return Math.floor((to.getTime() - from.getTime()) / ms) + 1;
}

function monthBounds(period: string) {
  const parts = period.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0));
  const workingDays = end.getUTCDate();
  return { start, end, workingDays };
}

export const hrService = {
  // ─── Employees ────────────────────────────────────────────────────────────
  async listEmployees(
    session: AppSession | null,
    filters: { branchId?: string; status?: string; q?: string } = {},
  ) {
    await authorize(session, 'hr:read');
    return prisma.employee.findMany({
      where: {
        branchId: filters.branchId,
        status: filters.status as never,
        OR: filters.q
          ? [
              { code: { contains: filters.q, mode: 'insensitive' } },
              { firstName: { contains: filters.q, mode: 'insensitive' } },
              { lastName: { contains: filters.q, mode: 'insensitive' } },
              { email: { contains: filters.q, mode: 'insensitive' } },
            ]
          : undefined,
      },
      include: { branch: true },
      orderBy: [{ status: 'asc' }, { code: 'asc' }],
    });
  },

  async getEmployee(session: AppSession | null, id: string) {
    await authorize(session, 'hr:read');
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!employee) throw new NotFoundError('Employee not found');
    return employee;
  },

  async createEmployee(session: AppSession | null, input: EmployeeCreateInput) {
    const actor = await authorize(session, 'hr:write');
    const dup = await prisma.employee.findUnique({ where: { code: input.code } });
    if (dup) throw new ValidationError('Employee code already exists');
    if (input.email) {
      const dupEmail = await prisma.employee.findUnique({ where: { email: input.email } });
      if (dupEmail) throw new ValidationError('Email already in use');
    }

    return prisma.$transaction(async (tx) => {
      const emp = await tx.employee.create({
        data: {
          branchId: input.branchId,
          code: input.code,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email || null,
          phone: input.phone || null,
          designation: input.designation || null,
          department: input.department || null,
          joinedAt: input.joinedAt,
          status: input.status,
          basicSalary: D(input.basicSalary),
          houseAllowance: D(input.houseAllowance),
          transportAllowance: D(input.transportAllowance),
          medicalAllowance: D(input.medicalAllowance),
          otherAllowance: D(input.otherAllowance),
          providentFund: D(input.providentFund),
          taxDeduction: D(input.taxDeduction),
          bankName: input.bankName || null,
          bankAccount: input.bankAccount || null,
          createdById: actor.userId,
          updatedById: actor.userId,
        },
      });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: input.branchId,
          module: 'hr',
          action: 'create-employee',
          entityType: 'Employee',
          entityId: emp.id,
          after: { code: emp.code, name: `${emp.firstName} ${emp.lastName}` },
        },
        tx,
      );
      return emp;
    });
  },

  async updateEmployee(session: AppSession | null, input: EmployeeUpdateInput) {
    const actor = await authorize(session, 'hr:write');
    const existing = await prisma.employee.findUnique({ where: { id: input.id } });
    if (!existing) throw new NotFoundError('Employee not found');
    if (input.code !== existing.code) {
      const dup = await prisma.employee.findUnique({ where: { code: input.code } });
      if (dup && dup.id !== existing.id) throw new ValidationError('Employee code already exists');
    }
    return prisma.$transaction(async (tx) => {
      const emp = await tx.employee.update({
        where: { id: input.id },
        data: {
          branchId: input.branchId,
          code: input.code,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email || null,
          phone: input.phone || null,
          designation: input.designation || null,
          department: input.department || null,
          joinedAt: input.joinedAt,
          status: input.status,
          basicSalary: D(input.basicSalary),
          houseAllowance: D(input.houseAllowance),
          transportAllowance: D(input.transportAllowance),
          medicalAllowance: D(input.medicalAllowance),
          otherAllowance: D(input.otherAllowance),
          providentFund: D(input.providentFund),
          taxDeduction: D(input.taxDeduction),
          bankName: input.bankName || null,
          bankAccount: input.bankAccount || null,
          updatedById: actor.userId,
        },
      });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: emp.branchId,
          module: 'hr',
          action: 'update-employee',
          entityType: 'Employee',
          entityId: emp.id,
          before: { status: existing.status, basic: existing.basicSalary.toString() },
          after: { status: emp.status, basic: emp.basicSalary.toString() },
        },
        tx,
      );
      return emp;
    });
  },

  // ─── Attendance ───────────────────────────────────────────────────────────
  async markAttendance(session: AppSession | null, input: AttendanceMarkInput) {
    const actor = await authorize(session, 'hr:attendance');
    const dateStr = input.date.toISOString().slice(0, 10);
    const checkIn = input.checkIn ? parseTimeOn(dateStr, input.checkIn) : null;
    const checkOut = input.checkOut ? parseTimeOn(dateStr, input.checkOut) : null;
    if (checkIn && checkOut && checkOut < checkIn) {
      throw new ValidationError('Check-out must be after check-in');
    }
    return prisma.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId: input.employeeId, date: input.date } },
      create: {
        employeeId: input.employeeId,
        date: input.date,
        status: input.status,
        checkIn,
        checkOut,
        remarks: input.remarks || null,
        createdById: actor.userId,
      },
      update: {
        status: input.status,
        checkIn,
        checkOut,
        remarks: input.remarks || null,
      },
    });
  },

  async listAttendance(
    session: AppSession | null,
    filters: { employeeId?: string; from?: Date; to?: Date; branchId?: string } = {},
  ) {
    await authorize(session, 'hr:read');
    return prisma.attendanceRecord.findMany({
      where: {
        employeeId: filters.employeeId,
        date: { gte: filters.from, lte: filters.to },
        employee: filters.branchId ? { branchId: filters.branchId } : undefined,
      },
      include: { employee: true },
      orderBy: [{ date: 'desc' }, { employeeId: 'asc' }],
      take: 500,
    });
  },

  // ─── Leave ────────────────────────────────────────────────────────────────
  async createLeave(session: AppSession | null, input: LeaveCreateInput) {
    const actor = await authorize(session, 'hr:write');
    const days = daysInclusive(input.fromDate, input.toDate);
    const emp = await prisma.employee.findUnique({ where: { id: input.employeeId } });
    if (!emp) throw new NotFoundError('Employee not found');

    return prisma.$transaction(async (tx) => {
      const lr = await tx.leaveRequest.create({
        data: {
          employeeId: input.employeeId,
          type: input.type,
          fromDate: input.fromDate,
          toDate: input.toDate,
          days,
          reason: input.reason || null,
          createdById: actor.userId,
        },
      });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: emp.branchId,
          module: 'hr',
          action: 'leave-request',
          entityType: 'LeaveRequest',
          entityId: lr.id,
          after: { days, type: lr.type, status: lr.status },
        },
        tx,
      );
      return lr;
    });
  },

  async listLeaves(
    session: AppSession | null,
    filters: { status?: string; branchId?: string; employeeId?: string } = {},
  ) {
    await authorize(session, 'hr:read');
    return prisma.leaveRequest.findMany({
      where: {
        status: filters.status as never,
        employeeId: filters.employeeId,
        employee: filters.branchId ? { branchId: filters.branchId } : undefined,
      },
      include: { employee: true },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 200,
    });
  },

  async decideLeave(session: AppSession | null, input: LeaveDecisionInput) {
    const actor = await authorize(session, 'hr:leave-approve');
    return prisma.$transaction(async (tx) => {
      const lr = await tx.leaveRequest.findUnique({
        where: { id: input.id },
        include: { employee: true },
      });
      if (!lr) throw new NotFoundError('Leave request not found');
      if (lr.status !== 'PENDING') throw new ValidationError('Leave is already decided');

      const updated = await tx.leaveRequest.update({
        where: { id: input.id },
        data: {
          status: input.decision,
          decidedById: actor.userId,
          decidedAt: new Date(),
          decisionNote: input.note || null,
        },
      });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: lr.employee.branchId,
          module: 'hr',
          action: `leave-${input.decision.toLowerCase()}`,
          entityType: 'LeaveRequest',
          entityId: lr.id,
          before: { status: lr.status },
          after: { status: updated.status },
        },
        tx,
      );
      return updated;
    });
  },

  // ─── Payroll ──────────────────────────────────────────────────────────────
  async listPayrollRuns(session: AppSession | null, filters: { branchId?: string } = {}) {
    await authorize(session, 'hr:read');
    return prisma.payrollRun.findMany({
      where: { branchId: filters.branchId },
      include: { branch: true, _count: { select: { payslips: true } } },
      orderBy: [{ period: 'desc' }],
    });
  },

  async getPayrollRun(session: AppSession | null, id: string) {
    await authorize(session, 'hr:read');
    const run = await prisma.payrollRun.findUnique({
      where: { id },
      include: {
        branch: true,
        payslips: {
          include: { employee: true },
          orderBy: { employee: { code: 'asc' } },
        },
      },
    });
    if (!run) throw new NotFoundError('Payroll run not found');
    return run;
  },

  async createPayrollRun(session: AppSession | null, input: PayrollRunCreateInput) {
    const actor = await authorize(session, 'hr:process-payroll');
    const existing = await prisma.payrollRun.findUnique({
      where: { branchId_period: { branchId: input.branchId, period: input.period } },
    });
    if (existing) throw new ValidationError(`Payroll for ${input.period} already exists`);

    const { start, end, workingDays } = monthBounds(input.period);

    const employees = await prisma.employee.findMany({
      where: { branchId: input.branchId, status: { in: ['ACTIVE', 'ON_LEAVE'] } },
    });
    if (employees.length === 0) throw new ValidationError('No active employees in this branch');

    // Pre-compute attendance / leave day counts per employee.
    const employeeIds = employees.map((e) => e.id);
    const [attendance, leaves] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: { employeeId: { in: employeeIds }, date: { gte: start, lte: end } },
      }),
      prisma.leaveRequest.findMany({
        where: {
          employeeId: { in: employeeIds },
          status: 'APPROVED',
          fromDate: { lte: end },
          toDate: { gte: start },
        },
      }),
    ]);
    const attByEmp = new Map<string, typeof attendance>();
    for (const a of attendance) {
      const arr = attByEmp.get(a.employeeId) ?? [];
      arr.push(a);
      attByEmp.set(a.employeeId, arr);
    }
    const leaveDaysByEmp = new Map<string, number>();
    for (const l of leaves) {
      const s = l.fromDate < start ? start : l.fromDate;
      const e = l.toDate > end ? end : l.toDate;
      const d = daysInclusive(s, e);
      leaveDaysByEmp.set(l.employeeId, (leaveDaysByEmp.get(l.employeeId) ?? 0) + d);
    }

    return prisma.$transaction(async (tx) => {
      const run = await tx.payrollRun.create({
        data: {
          branchId: input.branchId,
          period: input.period,
          status: 'DRAFT',
          notes: input.notes || null,
          createdById: actor.userId,
        },
      });

      let totalGross = ZERO;
      let totalDed = ZERO;
      let totalNet = ZERO;

      for (const emp of employees) {
        const att = attByEmp.get(emp.id) ?? [];
        const fullDays = att.filter((a) =>
          ['PRESENT', 'LATE'].includes(a.status),
        ).length;
        const halfDays = att.filter((a) => a.status === 'HALF_DAY').length;
        const absentDays = att.filter((a) => a.status === 'ABSENT').length;
        const leaveDays = leaveDaysByEmp.get(emp.id) ?? 0;

        // Worked days = full present + half-day * 0.5
        const effectiveWorked = fullDays + halfDays * 0.5;
        const workedDays = Math.min(workingDays, Math.max(0, effectiveWorked));

        // Prorate salary by (worked + paid leave) / workingDays.
        const paidRatio = D(workedDays + leaveDays).div(workingDays).toNumber();

        const basic = emp.basicSalary.mul(D(paidRatio));
        const ha = emp.houseAllowance.mul(D(paidRatio));
        const ta = emp.transportAllowance.mul(D(paidRatio));
        const ma = emp.medicalAllowance.mul(D(paidRatio));
        const oa = emp.otherAllowance.mul(D(paidRatio));
        const gross = basic.plus(ha).plus(ta).plus(ma).plus(oa);
        const pf = emp.providentFund;
        const tax = emp.taxDeduction;
        const deductions = pf.plus(tax);
        const net = gross.minus(deductions);

        await tx.payslip.create({
          data: {
            payrollRunId: run.id,
            employeeId: emp.id,
            workedDays,
            leaveDays,
            absentDays,
            basic,
            houseAllowance: ha,
            transportAllowance: ta,
            medicalAllowance: ma,
            otherAllowance: oa,
            providentFund: pf,
            taxDeduction: tax,
            gross,
            net,
          },
        });

        totalGross = totalGross.plus(gross);
        totalDed = totalDed.plus(deductions);
        totalNet = totalNet.plus(net);
      }

      const updated = await tx.payrollRun.update({
        where: { id: run.id },
        data: { totalGross, totalDeduction: totalDed, totalNet },
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: input.branchId,
          module: 'hr',
          action: 'create-payroll',
          entityType: 'PayrollRun',
          entityId: run.id,
          after: { period: input.period, employees: employees.length, net: totalNet.toString() },
        },
        tx,
      );

      return updated;
    });
  },

  async approvePayroll(session: AppSession | null, id: string) {
    const actor = await authorize(session, 'hr:approve-payroll');
    return prisma.$transaction(async (tx) => {
      const run = await tx.payrollRun.findUnique({ where: { id } });
      if (!run) throw new NotFoundError('Payroll run not found');
      if (run.status !== 'DRAFT') throw new ValidationError('Only draft runs can be approved');
      const updated = await tx.payrollRun.update({
        where: { id },
        data: { status: 'APPROVED', approvedById: actor.userId, approvedAt: new Date() },
      });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: run.branchId,
          module: 'hr',
          action: 'approve-payroll',
          entityType: 'PayrollRun',
          entityId: run.id,
          after: { status: 'APPROVED' },
        },
        tx,
      );
      return updated;
    });
  },

  async markPayrollPaid(session: AppSession | null, id: string) {
    const actor = await authorize(session, 'hr:pay-payroll');
    return prisma.$transaction(async (tx) => {
      const run = await tx.payrollRun.findUnique({ where: { id } });
      if (!run) throw new NotFoundError('Payroll run not found');
      if (run.status !== 'APPROVED') throw new ValidationError('Run must be approved first');
      const updated = await tx.payrollRun.update({
        where: { id },
        data: { status: 'PAID', paidById: actor.userId, paidAt: new Date() },
      });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: run.branchId,
          module: 'hr',
          action: 'pay-payroll',
          entityType: 'PayrollRun',
          entityId: run.id,
          after: { status: 'PAID' },
        },
        tx,
      );
      return updated;
    });
  },

  async lockPayroll(session: AppSession | null, id: string) {
    const actor = await authorize(session, 'hr:lock-payroll');
    return prisma.$transaction(async (tx) => {
      const run = await tx.payrollRun.findUnique({ where: { id } });
      if (!run) throw new NotFoundError('Payroll run not found');
      if (run.status !== 'PAID') throw new ValidationError('Only paid runs can be locked');
      const updated = await tx.payrollRun.update({
        where: { id },
        data: { status: 'LOCKED', lockedById: actor.userId, lockedAt: new Date() },
      });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: run.branchId,
          module: 'hr',
          action: 'lock-payroll',
          entityType: 'PayrollRun',
          entityId: run.id,
          after: { status: 'LOCKED' },
        },
        tx,
      );
      return updated;
    });
  },

  async cancelPayroll(session: AppSession | null, id: string) {
    const actor = await authorize(session, 'hr:process-payroll');
    return prisma.$transaction(async (tx) => {
      const run = await tx.payrollRun.findUnique({ where: { id } });
      if (!run) throw new NotFoundError('Payroll run not found');
      if (run.status !== 'DRAFT') throw new ValidationError('Only draft runs can be cancelled');
      await tx.payslip.deleteMany({ where: { payrollRunId: id } });
      const updated = await tx.payrollRun.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
      await recordAudit(
        {
          actorId: actor.userId,
          branchId: run.branchId,
          module: 'hr',
          action: 'cancel-payroll',
          entityType: 'PayrollRun',
          entityId: run.id,
          after: { status: 'CANCELLED' },
        },
        tx,
      );
      return updated;
    });
  },
};
