import { getSession } from '@/server/auth/session';
import { categoryService } from '@/server/services/product-category.service';
import { prisma } from '@/server/db';
import { PageHeader } from '@/components/shared/page-header';
import { ProductForm } from '../product-form';

export const metadata = { title: 'New product' };

export default async function NewProductPage() {
  const session = await getSession();
  const [categories, brands] = await Promise.all([
    categoryService.listFlat(session),
    prisma.productBrand.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <div>
      <PageHeader title="New product" description="Create a new SKU." />
      <ProductForm mode="create" categories={categories} brands={brands} />
    </div>
  );
}
