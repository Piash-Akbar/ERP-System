import { NextRequest } from 'next/server';
import { getSession } from '@/server/auth/session';
import { reportsService } from '@/server/services/reports.service';
import { csvResponse, toCsv } from '@/lib/csv';

export async function GET(req: NextRequest) {
  const session = await getSession();
  const sp = req.nextUrl.searchParams;
  const from = sp.get('from');
  const to = sp.get('to');
  const branchId = sp.get('branchId') ?? undefined;

  const data = await reportsService.salesSummary(session, {
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to + 'T23:59:59.999Z') : undefined,
    branchId,
  });

  const headers = ['Channel', 'Invoices', 'Gross', 'Discount', 'Tax', 'Paid', 'Outstanding'];
  const rows = data.channels.map((c) => [
    c.label,
    c.count,
    c.gross.toString(),
    c.discount.toString(),
    c.tax.toString(),
    c.paid.toString(),
    c.outstanding.toString(),
  ]);
  rows.push([
    'Total',
    data.totals.count,
    data.totals.gross.toString(),
    data.totals.discount.toString(),
    data.totals.tax.toString(),
    data.totals.paid.toString(),
    data.totals.outstanding.toString(),
  ]);

  return csvResponse(`sales-${from ?? 'all'}-${to ?? 'all'}.csv`, toCsv(headers, rows));
}
