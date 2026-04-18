import { NextRequest } from 'next/server';
import { getSession } from '@/server/auth/session';
import { reportsService } from '@/server/services/reports.service';
import { csvResponse, toCsv } from '@/lib/csv';

export async function GET(req: NextRequest) {
  const session = await getSession();
  const branchId = req.nextUrl.searchParams.get('branchId') ?? undefined;
  const data = await reportsService.inventoryValuation(session, { branchId });

  const headers = ['SKU', 'Name', 'Unit', 'Qty', 'Reorder', 'Cost', 'Value', 'Below reorder'];
  const rows = data.rows.map((r) => [
    r.sku,
    r.name,
    r.unit,
    r.qty.toString(),
    r.reorderLevel.toString(),
    r.cost.toString(),
    r.value.toString(),
    r.belowReorder ? 'Y' : '',
  ]);

  return csvResponse(`inventory-valuation${branchId ? `-${branchId}` : ''}.csv`, toCsv(headers, rows));
}
