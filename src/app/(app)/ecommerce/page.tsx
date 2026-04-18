import { getSession } from '@/server/auth/session';
import { authorize } from '@/server/auth/authorize';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'E-commerce' };

export default async function EcommerceOverviewPage() {
  const session = await getSession();
  await authorize(session, 'ecommerce:read');

  return (
    <div className="space-y-6">
      <PageHeader title="E-commerce / Online Sales" description="Order sync, fulfillment, shipment tracking & reconciliation.">
        <Badge variant="warning">Scaffold</Badge>
      </PageHeader>

      <Card>
        <CardContent className="p-6 space-y-3 text-sm">
          <p className="text-muted-foreground">
            This module is scaffolded but not yet wired to a live storefront. Per CLAUDE.md §7.9
            it will cover:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Order sync with external stores</li>
            <li>Order status lifecycle (pending → packed → shipped → delivered)</li>
            <li>Packing / fulfillment workflow (reuses warehouse + inventory)</li>
            <li>Shipment tracking and courier integration</li>
            <li>COD / online payment capture</li>
            <li>Return / refund (reuses POS refund flow)</li>
            <li>Payment reconciliation &amp; delayed-order alerts</li>
          </ul>
          <p className="text-xs text-muted-foreground pt-2">
            Permissions already registered: <code>ecommerce:read</code>, <code>ecommerce:fulfill</code>, <code>ecommerce:refund</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
