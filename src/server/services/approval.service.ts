import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { authorize } from '@/server/auth/authorize';
import { recordAudit } from '@/server/audit/logger';
import { publishNotification } from '@/server/notifications/publisher';
import type { AppSession } from '@/server/auth/session';
import type {
  ApprovalRuleInput,
  ApprovalSubmitInput,
  ApprovalDecisionInput,
} from '@/server/validators/approvals';
import { NotFoundError, ValidationError, ForbiddenError } from '@/lib/errors';

const REQUEST_INCLUDE = {
  rule: { select: { id: true, name: true, approverRoles: true, escalateAfterHours: true } },
  steps: { orderBy: { sequence: 'asc' } },
} satisfies Prisma.ApprovalRequestInclude;

async function findMatchingRule(module: string, action: string, amount: number) {
  return prisma.approvalRule.findFirst({
    where: {
      module,
      action,
      isActive: true,
      minAmount: { lte: new Prisma.Decimal(amount) },
    },
    orderBy: { minAmount: 'desc' },
  });
}

async function notifyRole(
  roleName: string,
  payload: { title: string; body: string; href?: string; module: string },
) {
  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE', roles: { some: { role: { name: roleName } } } },
    select: { id: true },
  });
  for (const u of users) {
    await publishNotification({
      recipientId: u.id,
      severity: 'INFO',
      module: payload.module,
      title: payload.title,
      body: payload.body,
      href: payload.href,
    });
  }
}

export const approvalService = {
  async listRules(session: AppSession | null) {
    await authorize(session, 'approvals:read');
    return prisma.approvalRule.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }, { minAmount: 'asc' }],
    });
  },

  async upsertRule(session: AppSession | null, input: ApprovalRuleInput, id?: string) {
    const actor = await authorize(session, 'approvals:configure');
    const data = {
      name: input.name,
      module: input.module,
      action: input.action,
      minAmount: new Prisma.Decimal(input.minAmount),
      approverRoles: input.approverRoles,
      escalateAfterHours: input.escalateAfterHours,
      isActive: input.isActive,
      description: input.description || null,
    };
    const rule = id
      ? await prisma.approvalRule.update({ where: { id }, data })
      : await prisma.approvalRule.create({ data });
    await recordAudit({
      actorId: actor.userId,
      branchId: null,
      module: 'approvals',
      action: id ? 'update-rule' : 'create-rule',
      entityType: 'ApprovalRule',
      entityId: rule.id,
      after: { name: rule.name, module: rule.module, action: rule.action },
    });
    return rule;
  },

  async submit(session: AppSession | null, input: ApprovalSubmitInput) {
    if (!session) throw new ForbiddenError('Not authenticated');
    const amount = input.amount ?? 0;
    const rule = await findMatchingRule(input.module, input.action, amount);
    if (!rule) {
      throw new ValidationError(
        `No approval rule configured for ${input.module}:${input.action}`,
      );
    }

    return prisma.$transaction(async (tx) => {
      const request = await tx.approvalRequest.create({
        data: {
          ruleId: rule.id,
          module: input.module,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          title: input.title,
          summary: input.summary || null,
          amount: input.amount != null ? new Prisma.Decimal(input.amount) : null,
          currency: input.currency,
          branchId: input.branchId || null,
          requestedById: session.userId,
          steps: {
            create: rule.approverRoles.map((role, i) => ({
              sequence: i + 1,
              approverRole: role,
              status: i === 0 ? 'ACTIVE' : 'WAITING',
            })),
          },
        },
        include: REQUEST_INCLUDE,
      });

      await recordAudit(
        {
          actorId: session.userId,
          branchId: request.branchId,
          module: 'approvals',
          action: 'submit',
          entityType: 'ApprovalRequest',
          entityId: request.id,
          after: { module: request.module, action: request.action, title: request.title },
        },
        tx,
      );

      return request;
    }).then(async (req) => {
      const first = req.steps[0];
      if (first) {
        await notifyRole(first.approverRole, {
          module: 'approvals',
          title: `Approval needed: ${req.title}`,
          body: `${req.module}:${req.action}`,
          href: `/approvals/${req.id}`,
        });
      }
      return req;
    });
  },

  async list(
    session: AppSession | null,
    filters: { status?: string; mine?: boolean; forMe?: boolean } = {},
  ) {
    const actor = await authorize(session, 'approvals:read');
    const where: Prisma.ApprovalRequestWhereInput = {
      status: filters.status as Prisma.ApprovalRequestWhereInput['status'],
    };
    if (filters.mine) where.requestedById = actor.userId;
    if (filters.forMe) {
      const user = await prisma.user.findUnique({
        where: { id: actor.userId },
        select: { roles: { select: { role: { select: { name: true } } } } },
      });
      const myRoles = user?.roles.map((r) => r.role.name) ?? [];
      where.steps = {
        some: { approverRole: { in: myRoles }, status: 'ACTIVE' },
      };
    }
    return prisma.approvalRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: REQUEST_INCLUDE,
    });
  },

  async getById(session: AppSession | null, id: string) {
    await authorize(session, 'approvals:read');
    const req = await prisma.approvalRequest.findUnique({
      where: { id },
      include: REQUEST_INCLUDE,
    });
    if (!req) throw new NotFoundError('Approval request not found');
    return req;
  },

  async approve(session: AppSession | null, input: ApprovalDecisionInput) {
    return this.decide(session, input, 'approve');
  },

  async reject(session: AppSession | null, input: ApprovalDecisionInput) {
    return this.decide(session, input, 'reject');
  },

  async requestChanges(session: AppSession | null, input: ApprovalDecisionInput) {
    return this.decide(session, input, 'changes');
  },

  async cancel(session: AppSession | null, input: ApprovalDecisionInput) {
    const actor = await authorize(session, 'approvals:read');
    const req = await prisma.approvalRequest.findUnique({ where: { id: input.requestId } });
    if (!req) throw new NotFoundError('Request not found');
    if (req.requestedById !== actor.userId) {
      throw new ForbiddenError('Only the requester can cancel');
    }
    if (req.status !== 'PENDING' && req.status !== 'CHANGES_REQUESTED') {
      throw new ValidationError('Only pending requests can be cancelled');
    }
    const updated = await prisma.approvalRequest.update({
      where: { id: req.id },
      data: { status: 'CANCELLED', decidedAt: new Date(), note: input.note || null },
    });
    await recordAudit({
      actorId: actor.userId,
      branchId: req.branchId,
      module: 'approvals',
      action: 'cancel',
      entityType: 'ApprovalRequest',
      entityId: req.id,
      after: { status: updated.status },
    });
    return updated;
  },

  async decide(
    session: AppSession | null,
    input: ApprovalDecisionInput,
    decision: 'approve' | 'reject' | 'changes',
  ) {
    const actor = await authorize(
      session,
      decision === 'reject' ? 'approvals:reject' : 'approvals:approve',
    );
    const user = await prisma.user.findUnique({
      where: { id: actor.userId },
      select: { roles: { select: { role: { select: { name: true } } } } },
    });
    const myRoles = new Set(user?.roles.map((r) => r.role.name) ?? []);

    return prisma.$transaction(async (tx) => {
      const request = await tx.approvalRequest.findUnique({
        where: { id: input.requestId },
        include: { steps: { orderBy: { sequence: 'asc' } } },
      });
      if (!request) throw new NotFoundError('Request not found');
      if (request.status !== 'PENDING' && request.status !== 'CHANGES_REQUESTED') {
        throw new ValidationError(`Cannot decide a ${request.status.toLowerCase()} request`);
      }

      const activeStep = request.steps.find((s) => s.status === 'ACTIVE');
      if (!activeStep) throw new ValidationError('No active step to decide on');
      if (!myRoles.has(activeStep.approverRole)) {
        throw new ForbiddenError(
          `Step ${activeStep.sequence} requires role "${activeStep.approverRole}"`,
        );
      }

      const now = new Date();
      const stepStatus =
        decision === 'approve' ? 'APPROVED' : decision === 'reject' ? 'REJECTED' : 'CHANGES_REQUESTED';

      await tx.approvalStep.update({
        where: { id: activeStep.id },
        data: {
          status: stepStatus,
          approverId: actor.userId,
          decidedAt: now,
          note: input.note || null,
        },
      });

      let nextStatus: Prisma.ApprovalRequestUpdateInput['status'] = request.status;
      let notifyNextRole: string | null = null;

      if (decision === 'reject') {
        nextStatus = 'REJECTED';
      } else if (decision === 'changes') {
        nextStatus = 'CHANGES_REQUESTED';
      } else {
        const remaining = request.steps.filter((s) => s.sequence > activeStep.sequence);
        const next = remaining[0];
        if (next) {
          await tx.approvalStep.update({
            where: { id: next.id },
            data: { status: 'ACTIVE' },
          });
          notifyNextRole = next.approverRole;
          nextStatus = 'PENDING';
        } else {
          nextStatus = 'APPROVED';
        }
      }

      const updated = await tx.approvalRequest.update({
        where: { id: request.id },
        data: {
          status: nextStatus,
          decidedAt:
            nextStatus === 'APPROVED' || nextStatus === 'REJECTED' ? now : request.decidedAt,
          note: input.note || null,
        },
      });

      await recordAudit(
        {
          actorId: actor.userId,
          branchId: request.branchId,
          module: 'approvals',
          action: decision,
          entityType: 'ApprovalRequest',
          entityId: request.id,
          before: { status: request.status, step: activeStep.sequence },
          after: { status: updated.status, decision },
        },
        tx,
      );

      return { updated, notifyNextRole, notifyRequester: true, title: request.title };
    }).then(async (result) => {
      if (result.notifyNextRole) {
        await notifyRole(result.notifyNextRole, {
          module: 'approvals',
          title: `Approval needed: ${result.title}`,
          body: 'An earlier approver signed off — your decision is required.',
          href: `/approvals/${result.updated.id}`,
        });
      }
      if (result.notifyRequester) {
        await publishNotification({
          recipientId: result.updated.requestedById,
          severity:
            result.updated.status === 'REJECTED'
              ? 'WARNING'
              : result.updated.status === 'APPROVED'
                ? 'INFO'
                : 'INFO',
          module: 'approvals',
          title: `Approval ${result.updated.status.toLowerCase()}: ${result.title}`,
          body: input.note || undefined,
          href: `/approvals/${result.updated.id}`,
        });
      }
      return result.updated;
    });
  },

  async queueStats(session: AppSession | null) {
    await authorize(session, 'approvals:read');
    const [pending, approved, rejected] = await Promise.all([
      prisma.approvalRequest.count({ where: { status: 'PENDING' } }),
      prisma.approvalRequest.count({ where: { status: 'APPROVED' } }),
      prisma.approvalRequest.count({ where: { status: 'REJECTED' } }),
    ]);
    return { pending, approved, rejected };
  },
};
