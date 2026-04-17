import { getSession } from '@/server/auth/session';
import { productService } from '@/server/services/product.service';
import { PageHeader } from '@/components/shared/page-header';
import { LabelSheet } from './label-sheet';

export const metadata = { title: 'Print labels' };

export default async function PrintLabelsPage() {
  const session = await getSession();
  const products = await productService.list(session);
  return (
    <div>
      <PageHeader
        title="Print labels"
        description="Pick quantities per SKU, hit Print. The sheet is A4 3-column; works with any label stock or plain paper with cut lines."
      />
      <LabelSheet
        products={products.map((p) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          barcode: p.barcode,
          sellPrice: p.sellPrice.toString(),
        }))}
      />
    </div>
  );
}
