import 'server-only';
import type { Prisma, NotificationSeverity } from '@prisma/client';
import { prisma } from '@/server/db';

type SseSend = (payload: unknown) => void;

/**
 * Per-recipient in-memory subscriber registry. Keyed by userId, each entry
 * holds the set of active SSE senders. Notifications are fanned out to every
 * sender for the matching user so a user with multiple tabs sees every event.
 *
 * This is a single-process map. For multi-instance deployments, swap in
 * Pusher/Ably/Redis pub-sub here — the publisher API stays identical.
 */
const subscribers = new Map<string, Set<SseSend>>();

export function subscribe(userId: string, send: SseSend): () => void {
  let set = subscribers.get(userId);
  if (!set) {
    set = new Set();
    subscribers.set(userId, set);
  }
  set.add(send);
  return () => {
    const s = subscribers.get(userId);
    if (!s) return;
    s.delete(send);
    if (s.size === 0) subscribers.delete(userId);
  };
}

function fanout(userId: string, payload: unknown) {
  const set = subscribers.get(userId);
  if (!set) return;
  for (const send of set) {
    try {
      send(payload);
    } catch {
      // sender gone; will be cleaned up by its own close handler
    }
  }
}

export interface PublishInput {
  recipientId: string;
  branchId?: string | null;
  severity?: NotificationSeverity;
  module: string;
  title: string;
  body?: string;
  href?: string;
}

export async function publishNotification(
  input: PublishInput,
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? prisma;
  const created = await client.notification.create({
    data: {
      recipientId: input.recipientId,
      branchId: input.branchId ?? null,
      severity: input.severity ?? 'INFO',
      module: input.module,
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? null,
    },
  });
  fanout(input.recipientId, created);
  return created;
}

export async function publishToUsers(
  userIds: string[],
  input: Omit<PublishInput, 'recipientId'>,
) {
  for (const id of userIds) {
    await publishNotification({ ...input, recipientId: id });
  }
}
