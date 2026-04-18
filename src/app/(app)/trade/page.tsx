import { getSession } from '@/server/auth/session';
import { authorize } from '@/server/auth/authorize';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Export / Import' };

export default async function TradeOverviewPage() {
  const session = await getSession();
  await authorize(session, 'trade:read');

  return (
    <div className="space-y-6">
      <PageHeader title="Export / Import" description="Cross-border shipment, trade documents & foreign payment.">
        <Badge variant="warning">Scaffold</Badge>
      </PageHeader>

      <Card>
        <CardContent className="p-6 space-y-3 text-sm">
          <p className="text-muted-foreground">
            This module is scaffolded but not yet implemented. Per CLAUDE.md §7.10 the scope is:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1">
            <li>Export / import order with shipment stages</li>
            <li>Trade documents (BL, LC, invoice, packing list, COO) via DMS</li>
            <li>Foreign payment capture with exchange-rate handling</li>
            <li>Compliance checks &amp; missing / expired document alerts</li>
          </ul>
          <p className="text-xs text-muted-foreground pt-2">
            Permissions already registered: <code>trade:read</code>, <code>trade:write</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
