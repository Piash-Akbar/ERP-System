import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/data-table';
import { assetService } from '@/server/services/asset.service';
import { getSession } from '@/server/auth/session';
import { CategoryForm } from './category-form';

export const metadata = { title: 'Asset categories' };

export default async function AssetCategoriesPage() {
  const session = await getSession();
  const categories = await assetService.listCategories(session);

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Asset Categories"
        description="Depreciation defaults per asset category"
      >
        <Button variant="outline" asChild>
          <Link href="/assets">
            <ArrowLeft className="h-4 w-4" /> Back to assets
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <Card className="p-0">
          <div className="px-4 py-3 border-b text-sm font-medium">
            {categories.length} Categor{categories.length === 1 ? 'y' : 'ies'}
          </div>
          <DataTable
            rows={categories}
            rowKey={(r) => r.id}
            empty="No categories yet."
            columns={[
              { key: 'name', header: 'Name', cell: (r) => r.name },
              {
                key: 'method',
                header: 'Method',
                cell: (r) => r.depreciationMethod.replace('_', ' ').toLowerCase(),
              },
              {
                key: 'life',
                header: 'Life (mo)',
                align: 'right',
                cell: (r) => <span className="tabular">{r.defaultLifeMonths}</span>,
              },
              {
                key: 'salvage',
                header: 'Salvage',
                align: 'right',
                cell: (r) => (
                  <span className="tabular">
                    {(Number(r.defaultSalvageRate) * 100).toFixed(1)}%
                  </span>
                ),
              },
              {
                key: 'assets',
                header: 'Assets',
                align: 'right',
                cell: (r) => <span className="tabular">{r._count.assets}</span>,
              },
            ]}
          />
        </Card>

        <CategoryForm />
      </div>
    </div>
  );
}
