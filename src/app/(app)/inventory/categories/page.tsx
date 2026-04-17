import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { categoryService } from '@/server/services/product-category.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Product categories' };

export default async function CategoriesPage() {
  const session = await getSession();
  const categories = await categoryService.list(session);
  const canWrite = session?.permissions.includes('inventory:write') ?? false;

  return (
    <div>
      <PageHeader title="Product categories" description="Group products for reporting and filtering.">
        {canWrite && (
          <Button asChild>
            <Link href="/inventory/categories/new">
              <Plus className="h-4 w-4" />
              New category
            </Link>
          </Button>
        )}
      </PageHeader>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Name</th>
                <th className="text-left font-semibold px-4 py-3">Parent</th>
                <th className="text-left font-semibold px-4 py-3">Description</th>
                <th className="text-right font-semibold px-4 py-3">Products</th>
                <th className="text-right font-semibold px-4 py-3">Children</th>
                <th className="text-right font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.parent?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-md truncate">
                    {c.description ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular">{c._count.products}</td>
                  <td className="px-4 py-3 text-right tabular">{c._count.children}</td>
                  <td className="px-4 py-3">
                    {canWrite && (
                      <div className="flex items-center justify-end">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/inventory/categories/${c.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
