import { Building2, ChevronDown } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { branchService } from '@/server/services/branch.service';
import { setActiveBranchAction } from '@/server/actions/branches';

export async function BranchSwitcher() {
  const session = await getSession();
  if (!session) return null;

  let branches: Awaited<ReturnType<typeof branchService.listActive>> = [];
  try {
    branches = await branchService.listActive(session);
  } catch {
    return null;
  }

  const active = branches.find((b) => b.id === session.activeBranchId) ?? branches[0];

  return (
    <div className="relative group">
      <button
        type="button"
        className="inline-flex items-center gap-2 h-9 px-3 rounded-md border bg-background text-sm hover:bg-muted/50"
      >
        <Building2 className="h-4 w-4" />
        <span className="font-medium">{active?.name ?? 'Select branch'}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <div className="absolute right-0 mt-1 min-w-[220px] rounded-md border bg-popover text-popover-foreground shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-20">
        <div className="px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground border-b">
          Switch branch
        </div>
        <ul className="py-1 max-h-80 overflow-y-auto">
          {branches.map((b) => (
            <li key={b.id}>
              <form action={setActiveBranchAction}>
                <input type="hidden" name="branchId" value={b.id} />
                <button
                  type="submit"
                  className={
                    'w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ' +
                    (b.id === active?.id ? 'bg-muted/50 font-medium' : '')
                  }
                >
                  <span className="block">{b.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {b.code} · {b.currency}
                  </span>
                </button>
              </form>
            </li>
          ))}
          {branches.length === 0 && (
            <li className="px-3 py-6 text-sm text-muted-foreground text-center">No branches</li>
          )}
        </ul>
      </div>
    </div>
  );
}
