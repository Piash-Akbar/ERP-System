import Link from 'next/link';
import { Printer, Sparkles } from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { productService } from '@/server/services/product.service';
import { assignBarcodeAction } from '@/server/actions/products';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Barcode management' };

export default async function BarcodePage() {
  const session = await getSession();
  const products = await productService.list(session);
  const canGen = session?.permissions.includes('barcode:generate') ?? false;

  const missing = products.filter((p) => !p.barcode);
  const withCodes = products.filter((p) => !!p.barcode);

  return (
    <div>
      <PageHeader
        title="Barcode management"
        description="Assign scanner-friendly codes to products and print label sheets."
      >
        <Button asChild>
          <Link href="/barcode/print">
            <Printer className="h-4 w-4" />
            Print labels
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total products</p>
          <p className="text-2xl font-semibold tabular mt-1">{products.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Barcoded</p>
          <p className="text-2xl font-semibold tabular mt-1 text-success">{withCodes.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Missing</p>
          <p className="text-2xl font-semibold tabular mt-1 text-warning">{missing.length}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">SKU</th>
                <th className="text-left font-semibold px-4 py-3">Name</th>
                <th className="text-left font-semibold px-4 py-3">Unit</th>
                <th className="text-left font-semibold px-4 py-3">Barcode</th>
                <th className="text-right font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.unit}</td>
                  <td className="px-4 py-3">
                    {p.barcode ? (
                      <span className="font-mono text-xs">{p.barcode}</span>
                    ) : (
                      <Badge variant="warning">Missing</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      {canGen && !p.barcode && (
                        <form action={assignBarcodeAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <Button size="sm" variant="outline" type="submit">
                            <Sparkles className="h-3.5 w-3.5" />
                            Generate
                          </Button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No products yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
