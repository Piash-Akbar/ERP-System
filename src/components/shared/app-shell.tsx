import { Search, LogOut } from 'lucide-react';
import { MODULES } from '@/constants/navigation';
import { getSession } from '@/server/auth/session';
import { logoutAction } from '@/server/actions/auth';
import { BranchSwitcher } from '@/components/shared/branch-switcher';
import { NotificationBell } from '@/components/shared/notification-bell';
import { SidebarNav, type ClientNavModule } from '@/components/shared/sidebar-nav';
import { notificationService } from '@/server/services/notification.service';

async function renderBell(hasPermission: boolean) {
  if (!hasPermission) return null;
  const [unread, items] = await Promise.all([
    notificationService.unreadCount(await getSession()),
    notificationService.list(await getSession(), { limit: 10 }),
  ]);
  return (
    <NotificationBell
      initialUnread={unread}
      initialItems={items.map((n) => ({
        id: n.id,
        severity: n.severity,
        module: n.module,
        title: n.title,
        body: n.body,
        href: n.href,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      }))}
    />
  );
}

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const initials =
    session?.name
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? '?';

  const perms = session?.permissions ?? [];
  const can = (p?: string) => !p || perms.includes(p);

  const visibleModules: ClientNavModule[] = MODULES.filter((m) => {
    if (!can(m.permission)) return false;
    const childrenVisible = m.items?.some((i) => can(i.permission)) ?? false;
    return !m.items || childrenVisible || can(m.permission);
  }).map((m) => ({
    number: m.number,
    label: m.label,
    href: m.href,
    iconName: m.iconName,
    items: m.items?.filter((i) => can(i.permission)).map((i) => ({
      label: i.label,
      href: i.href,
    })),
  }));

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex">
        <aside className="w-64 bg-sidebar text-sidebar-foreground min-h-screen sticky top-0 flex flex-col">
          <div className="px-5 py-5 border-b border-white/10">
            <p className="text-base font-semibold">Annex Leather</p>
            <p className="text-xs text-white/60 mt-0.5">Enterprise ERP</p>
          </div>
          <SidebarNav modules={visibleModules} />
          <div className="border-t border-white/10 p-3 space-y-2">
            <div className="px-2 text-xs text-white/80">
              <p className="font-medium truncate">{session?.name ?? 'Guest'}</p>
              <p className="text-white/50 truncate">{session?.email}</p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </form>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 bg-background border-b sticky top-0 z-10 flex items-center gap-3 px-6">
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search products, SKU, barcode, accounts…"
                  className="w-full h-9 pl-9 pr-3 rounded-md border bg-muted/40 text-sm outline-none focus:bg-background focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <BranchSwitcher />
            {session && (await renderBell(session.permissions.includes('notifications:read')))}
            <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-semibold">
              {initials}
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
