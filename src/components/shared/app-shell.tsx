import Link from 'next/link';
import { Bell, Search, LogOut } from 'lucide-react';
import { NAV } from '@/constants/navigation';
import { cn } from '@/lib/utils';
import { getSession } from '@/server/auth/session';
import { logoutAction } from '@/server/actions/auth';
import { BranchSwitcher } from '@/components/shared/branch-switcher';

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const initials =
    session?.name
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? '?';

  const visibleGroups = NAV.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.permission || session?.permissions.includes(item.permission),
    ),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex">
        <aside className="w-64 bg-sidebar text-sidebar-foreground min-h-screen sticky top-0 flex flex-col">
          <div className="px-5 py-5 border-b border-white/10">
            <p className="text-base font-semibold">Annex Leather</p>
            <p className="text-xs text-white/60 mt-0.5">Enterprise ERP</p>
          </div>
          <nav className="flex-1 overflow-y-auto py-3">
            {visibleGroups.map((group) => (
              <div key={group.label} className="px-3 pb-4">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  {group.label}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 rounded-md px-2 py-2 text-sm text-white/80',
                            'hover:bg-white/5 hover:text-white transition-colors',
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
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
            <button className="relative h-9 w-9 rounded-md border bg-background grid place-items-center">
              <Bell className="h-4 w-4" />
            </button>
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
