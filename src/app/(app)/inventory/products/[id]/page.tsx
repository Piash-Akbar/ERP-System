import { getSession } from '@/server/auth/session';
import { productService } from '@/server/services/product.service';
import { categoryService } from '@/server/services/product-category.service';
import { prisma } from '@/server/db';
import { PageHeader } from '@/components/shared/page-header';
import { ProductForm } from '../product-form';

export const metadata = { title: 'Edit product' };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const [product, categories, brands] = await Promise.all([
    productService.getById(session, id),
    categoryService.listFlat(session),
    prisma.productBrand.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <div>
      <PageHeader title={product.name} description={`SKU ${product.sku}`} />
      <ProductForm
        mode="edit"
        initial={{
          id: product.id,
          sku: product.sku,
          barcode: product.barcode,
          name: product.name,
          description: product.description,
          type: product.type,
          unit: product.unit,
          categoryId: product.categoryId,
          brandId: product.brandId,
          costPrice: product.costPrice.toString(),
          sellPrice: product.sellPrice.toString(),
          taxRate: product.taxRate.toString(),
          reorderLevel: product.reorderLevel.toString(),
          reorderQty: product.reorderQty.toString(),
          isActive: product.isActive,
          imageUrl: product.imageUrl,
        }}
        categories={categories}
        brands={brands}
      />
    </div>
  );
}
