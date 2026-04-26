import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { productService } from '@/server/services/product.service';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { ProductsBrowser, type ProductRow } from './products-browser';

export const metadata = { title: 'Products' };

export default async function ProductsPage() {
  const session = await getSession();
  const products = await productService.list(session);
  const canWrite = session?.permissions.includes('inventory:write') ?? false;

  const rows: ProductRow[] = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    barcode: p.barcode,
    name: p.name,
    unit: p.unit,
    costPrice: p.costPrice.toString(),
    sellPrice: p.sellPrice.toString(),
    reorderLevel: p.reorderLevel.toString(),
    availableQty: p.availableQty.toString(),
    isActive: p.isActive,
    category: p.category ? { id: p.category.id, name: p.category.name } : null,
  }));

  return (
    <div>
      <PageHeader title="Products" description="Master list of SKUs. Stock levels land with goods receiving / issue.">
        {canWrite && (
          <Button asChild>
            <Link href="/inventory/products/new">
              <Plus className="h-4 w-4" />
              New product
            </Link>
          </Button>
        )}
      </PageHeader>

      <ProductsBrowser products={rows} canWrite={canWrite} />
    </div>
  );
}
