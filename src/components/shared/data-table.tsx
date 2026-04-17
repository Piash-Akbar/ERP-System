import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  headerClassName?: string;
}

/** Minimal server-rendered data table. Client-side filtering/sorting
 * happens in the parent page via URL search params for consistency. */
export function DataTable<T>({
  columns,
  rows,
  empty = 'No records',
  rowKey,
  className,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  empty?: React.ReactNode;
  rowKey: (row: T, idx: number) => string;
  className?: string;
}) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  'px-3 py-2 font-medium text-xs uppercase tracking-wider',
                  c.align === 'right' && 'text-right',
                  c.align === 'center' && 'text-center',
                  c.headerClassName,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-10 text-center text-sm text-muted-foreground"
              >
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={rowKey(row, idx)} className="border-b last:border-0 hover:bg-muted/30">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      'px-3 py-3',
                      c.align === 'right' && 'text-right',
                      c.align === 'center' && 'text-center',
                      c.className,
                    )}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
