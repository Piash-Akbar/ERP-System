'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationLite {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  module: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificationBell({
  initialUnread,
  initialItems,
}: {
  initialUnread: number;
  initialItems: NotificationLite[];
}) {
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<NotificationLite[]>(initialItems);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const es = new EventSource('/api/sse/notifications');
    es.onmessage = (ev) => {
      if (!ev.data) return;
      try {
        const payload = JSON.parse(ev.data);
        if (payload?.id && payload?.title) {
          setItems((prev) => [payload, ...prev].slice(0, 20));
          setUnread((u) => u + 1);
        }
      } catch {
        // ignore
      }
    };
    es.onerror = () => {
      // let the browser retry automatically
    };
    return () => es.close();
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative h-9 w-9 rounded-md border bg-background grid place-items-center hover:bg-muted/60"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-semibold rounded-full min-w-4 h-4 px-1 grid place-items-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 rounded-md border bg-background shadow-lg z-20 overflow-hidden">
            <div className="px-3 py-2 border-b flex items-center justify-between">
              <span className="text-sm font-medium">Notifications</span>
              <Link
                href="/notifications"
                className="text-xs text-blue-600 hover:underline"
                onClick={() => setOpen(false)}
              >
                View all
              </Link>
            </div>
            <ul className="max-h-96 overflow-y-auto divide-y">
              {items.length === 0 ? (
                <li className="px-3 py-6 text-xs text-muted-foreground text-center">
                  No notifications yet.
                </li>
              ) : (
                items.map((n) => {
                  const tone =
                    n.severity === 'CRITICAL'
                      ? 'bg-red-500'
                      : n.severity === 'WARNING'
                        ? 'bg-amber-500'
                        : 'bg-blue-500';
                  const content = (
                    <div className="px-3 py-2 hover:bg-muted/50">
                      <div className="flex items-start gap-2">
                        <span className={cn('mt-1 h-2 w-2 rounded-full flex-shrink-0', tone)} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{n.title}</div>
                          {n.body && (
                            <div className="text-xs text-muted-foreground line-clamp-2">{n.body}</div>
                          )}
                          <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
                            {n.module}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {n.href ? (
                        <Link href={n.href} onClick={() => setOpen(false)}>
                          {content}
                        </Link>
                      ) : (
                        content
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
