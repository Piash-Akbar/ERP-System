import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/shared/pill';
import { notificationService } from '@/server/services/notification.service';
import { getSession } from '@/server/auth/session';
import { markAllNotificationsReadAction } from '@/server/actions/notifications';

async function markAllReadFormAction() {
  'use server';
  await markAllNotificationsReadAction();
}

export const metadata = { title: 'Notifications' };

interface Search {
  unread?: string;
}

type PillTone = 'blue' | 'amber' | 'red';

const TONE: Record<'INFO' | 'WARNING' | 'CRITICAL', PillTone> = {
  INFO: 'blue',
  WARNING: 'amber',
  CRITICAL: 'red',
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  const onlyUnread = sp.unread === '1';
  const [items, unread] = await Promise.all([
    notificationService.list(session, { onlyUnread, limit: 200 }),
    notificationService.unreadCount(session),
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Notifications"
        description={`${unread} unread of ${items.length} shown`}
      >
        <form action={markAllReadFormAction}>
          <Button type="submit" variant="outline" disabled={unread === 0}>
            Mark all read
          </Button>
        </form>
      </PageHeader>

      <Card className="p-2 flex gap-2">
        <Button variant={onlyUnread ? 'ghost' : 'dark'} size="sm" asChild>
          <Link href="/notifications">All</Link>
        </Button>
        <Button variant={onlyUnread ? 'dark' : 'ghost'} size="sm" asChild>
          <Link href="/notifications?unread=1">Unread</Link>
        </Button>
      </Card>

      <Card className="p-0">
        {items.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground text-center">
            {onlyUnread ? 'No unread notifications.' : 'No notifications yet.'}
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((n) => (
              <li key={n.id} className={n.readAt ? '' : 'bg-blue-50/40'}>
                {n.href ? (
                  <Link href={n.href} className="block px-4 py-3 hover:bg-muted/40">
                    <NotificationRow n={n} />
                  </Link>
                ) : (
                  <div className="px-4 py-3">
                    <NotificationRow n={n} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function NotificationRow({
  n,
}: {
  n: {
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    module: string;
    title: string;
    body: string | null;
    createdAt: Date;
    readAt: Date | null;
  };
}) {
  return (
    <div className="flex items-start gap-3">
      <Pill tone={TONE[n.severity]}>{n.severity.toLowerCase()}</Pill>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{n.title}</span>
          {!n.readAt && <span className="text-[10px] font-semibold text-blue-600">NEW</span>}
        </div>
        {n.body && <div className="text-sm text-muted-foreground mt-0.5">{n.body}</div>}
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
          <span className="uppercase tracking-wider">{n.module}</span>
          <span className="tabular">{n.createdAt.toISOString().replace('T', ' ').slice(0, 16)}</span>
        </div>
      </div>
    </div>
  );
}
