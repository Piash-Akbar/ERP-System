import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/shared/pill';
import { approvalService } from '@/server/services/approval.service';
import { getSession } from '@/server/auth/session';
import { NotFoundError } from '@/lib/errors';
import { APPROVAL_STATUS } from '@/server/validators/approvals';
import { ApprovalDecisionPanel } from './decision-panel';

export const metadata = { title: 'Approval request' };

type PillTone = 'grey' | 'blue' | 'amber' | 'green' | 'red' | 'orange';
const TONE: Record<(typeof APPROVAL_STATUS)[number], PillTone> = {
  PENDING: 'amber',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'grey',
  CHANGES_REQUESTED: 'orange',
  ESCALATED: 'red',
};

const STEP_TONE: Record<string, PillTone> = {
  WAITING: 'grey',
  ACTIVE: 'amber',
  APPROVED: 'green',
  REJECTED: 'red',
  SKIPPED: 'grey',
  CHANGES_REQUESTED: 'orange',
};

export default async function ApprovalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  let req: Awaited<ReturnType<typeof approvalService.getById>>;
  try {
    req = await approvalService.getById(session, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }

  const active = req.steps.find((s) => s.status === 'ACTIVE');
  const canDecide =
    !!active && !!session && session.roles.includes(active.approverRole);
  const canCancel = !!session && session.userId === req.requestedById && req.status === 'PENDING';

  return (
    <div className="space-y-6">
      <PageHeader title={req.title} description={`${req.module}:${req.action}`}>
        <Button variant="outline" asChild>
          <Link href="/approvals">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
          <Card className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground text-xs">Status</div>
              <Pill tone={TONE[req.status]}>{req.status.replace('_', ' ').toLowerCase()}</Pill>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Amount</div>
              <div className="tabular">
                {req.amount ? `${req.currency ?? ''} ${req.amount.toString()}` : '—'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Submitted</div>
              <div className="tabular">{req.createdAt.toISOString().slice(0, 10)}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Entity</div>
              <div className="tabular text-xs">
                {req.entityType} #{req.entityId.slice(0, 8)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Rule</div>
              <div>{req.rule?.name ?? '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Decided</div>
              <div className="tabular">{req.decidedAt?.toISOString().slice(0, 10) ?? '—'}</div>
            </div>
            {req.summary && (
              <div className="md:col-span-3 pt-4 border-t text-muted-foreground">{req.summary}</div>
            )}
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium mb-3">Approval chain</div>
            <ol className="space-y-2">
              {req.steps.map((s) => (
                <li key={s.id} className="flex items-center gap-3 text-sm">
                  <span className="tabular text-xs text-muted-foreground w-6">
                    #{s.sequence}
                  </span>
                  <span className="flex-1">{s.approverRole}</span>
                  <Pill tone={STEP_TONE[s.status] ?? 'grey'}>
                    {s.status.replace('_', ' ').toLowerCase()}
                  </Pill>
                  {s.decidedAt && (
                    <span className="text-xs text-muted-foreground tabular">
                      {s.decidedAt.toISOString().slice(0, 10)}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <ApprovalDecisionPanel
          requestId={req.id}
          canDecide={canDecide}
          canCancel={canCancel}
          activeRole={active?.approverRole ?? null}
        />
      </div>
    </div>
  );
}
