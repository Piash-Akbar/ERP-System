import { NextRequest } from 'next/server';
import { getSession } from '@/server/auth/session';
import { reportsService } from '@/server/services/reports.service';
import { csvResponse, toCsv } from '@/lib/csv';

export async function GET(req: NextRequest) {
  const session = await getSession();
  const sp = req.nextUrl.searchParams;
  const from = sp.get('from') ?? undefined;
  const to = sp.get('to') ?? undefined;
  const branchId = sp.get('branchId') ?? undefined;

  const data = await reportsService.cashFlow(session, {
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to + 'T23:59:59.999Z') : undefined,
    branchId,
  });

  const headers = ['Date', 'Flow', 'Source', 'Reference', 'Party', 'Method', 'Branch', 'Amount'];
  const rows = data.rows.map((r) => [
    r.date.toISOString().slice(0, 10),
    r.flow,
    r.source,
    r.ref,
    r.party,
    r.method,
    r.branch,
    (r.flow === 'IN' ? '' : '-') + r.amount.toFixed(2),
  ]);

  // Append summary section
  rows.push([], ['--- Income summary ---'], ['Source', '', '', '', '', '', '', 'Amount']);
  for (const s of data.incomeSources) {
    rows.push([s.label, '', '', '', '', '', `${s.count} txns`, s.amount.toFixed(2)]);
  }
  rows.push(['Total income', '', '', '', '', '', '', data.totalIncome.toFixed(2)]);
  rows.push([], ['--- Outcome summary ---'], ['Source', '', '', '', '', '', '', 'Amount']);
  for (const s of data.outcomeSources) {
    rows.push([s.label, '', '', '', '', '', `${s.count} txns`, s.amount.toFixed(2)]);
  }
  rows.push(['Total outcome', '', '', '', '', '', '', data.totalOutcome.toFixed(2)]);
  rows.push(['Net cash', '', '', '', '', '', '', data.net.toFixed(2)]);

  const filename = `cash-flow-${from ?? 'all'}-${to ?? 'all'}.csv`;
  return csvResponse(filename, toCsv(headers, rows));
}
