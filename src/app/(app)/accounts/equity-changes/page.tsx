import { getSession } from '@/server/auth/session';
import { accountsService } from '@/server/services/accounts.service';

export default async function EquityChangesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; branchId?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();

  const now = new Date();
  const from = sp.from ? new Date(sp.from) : new Date(now.getFullYear(), 0, 1);
  const to = sp.to ? new Date(sp.to) : now;

  const data = await accountsService.changesInEquity(session, {
    branchId: sp.branchId,
    from,
    to,
  });

  const c = data.current;

  const fmt = (n: { toString(): string } | null | undefined) => {
    const num = Number((n ?? 0).toString());
    const abs = Math.abs(num).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return num < 0 ? `(${abs})` : abs;
  };

  const year = from.getFullYear();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold">Annex Leather Ltd.</h1>
        <p className="text-sm text-gray-500">Statement of Changes in Equity</p>
        <p className="text-sm text-gray-500">For the year ended {to.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>

      <form method="get" className="flex gap-3 mb-6 no-print">
        <input type="date" name="from" defaultValue={from.toISOString().slice(0, 10)} className="border rounded px-2 py-1 text-sm" />
        <input type="date" name="to" defaultValue={to.toISOString().slice(0, 10)} className="border rounded px-2 py-1 text-sm" />
        <button type="submit" className="px-3 py-1 bg-blue-600 text-white text-sm rounded">Apply</button>
        <button type="button" onClick={() => window.print()} className="px-3 py-1 bg-gray-100 border text-sm rounded ml-auto">Print</button>
      </form>

      <table className="w-full text-sm border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2 text-left">Particulars</th>
            <th className="border border-gray-300 p-2 text-right w-32">Share Capital</th>
            <th className="border border-gray-300 p-2 text-right w-32">Retained Earnings</th>
            <th className="border border-gray-300 p-2 text-right w-32">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 p-2">Balance as at 30 June {year - 1}</td>
            <td className="border border-gray-300 p-2 text-right">{fmt(c.openingShareCapital)}</td>
            <td className="border border-gray-300 p-2 text-right">{fmt(c.openingRetained)}</td>
            <td className="border border-gray-300 p-2 text-right">{fmt(c.openingShareCapital.plus(c.openingRetained))}</td>
          </tr>
          {c.shareCapitalAdded.abs().gt(0) && (
            <tr>
              <td className="border border-gray-300 p-2">Add: increase paid up capital</td>
              <td className="border border-gray-300 p-2 text-right">{fmt(c.shareCapitalAdded)}</td>
              <td className="border border-gray-300 p-2 text-right">-</td>
              <td className="border border-gray-300 p-2 text-right">{fmt(c.shareCapitalAdded)}</td>
            </tr>
          )}
          <tr>
            <td className="border border-gray-300 p-2">Profit/(loss) After Tax for the year</td>
            <td className="border border-gray-300 p-2 text-right">-</td>
            <td className="border border-gray-300 p-2 text-right">{fmt(c.netProfit)}</td>
            <td className="border border-gray-300 p-2 text-right">{fmt(c.netProfit)}</td>
          </tr>
          <tr className="font-bold bg-gray-50">
            <td className="border border-gray-300 p-2">Balance as on {to.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
            <td className="border border-gray-300 p-2 text-right">{fmt(c.closeShareCapital)}</td>
            <td className="border border-gray-300 p-2 text-right">{fmt(c.closingRetained)}</td>
            <td className="border border-gray-300 p-2 text-right">{fmt(c.totalEquity)}</td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-between mt-16 text-sm">
        <div className="text-center">
          <div className="border-t border-gray-800 w-40 pt-1">Managing Director</div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-800 w-40 pt-1">Director</div>
        </div>
      </div>
    </div>
  );
}
