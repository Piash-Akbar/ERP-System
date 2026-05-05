import { getSession } from '@/server/auth/session';
import { accountsService } from '@/server/services/accounts.service';

export default async function CashFlowPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; branchId?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();

  const now = new Date();
  const from = sp.from ? new Date(sp.from) : new Date(now.getFullYear(), 0, 1);
  const to = sp.to ? new Date(sp.to) : now;

  const data = await accountsService.cashFlowStatement(session, {
    branchId: sp.branchId,
    from,
    to,
  });

  const fmt = (n: { toString(): string } | null | undefined, parens = false) => {
    const num = Number((n ?? 0).toString());
    const abs = Math.abs(num).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    if (num < 0) return parens ? `(${abs})` : `-${abs}`;
    return abs;
  };

  const fmtLabel = from.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const toLabel = to.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold">Annex Leather Ltd.</h1>
        <p className="text-sm text-gray-500">Statement of Cash Flows</p>
        <p className="text-sm text-gray-500">For the period {fmtLabel} to {toLabel}</p>
      </div>

      <form method="get" className="flex gap-3 mb-6 no-print">
        <input type="date" name="from" defaultValue={from.toISOString().slice(0, 10)} className="border rounded px-2 py-1 text-sm" />
        <input type="date" name="to" defaultValue={to.toISOString().slice(0, 10)} className="border rounded px-2 py-1 text-sm" />
        <button type="submit" className="px-3 py-1 bg-blue-600 text-white text-sm rounded">Apply</button>
        <button type="button" onClick={() => window.print()} className="px-3 py-1 bg-gray-100 border text-sm rounded ml-auto">Print</button>
      </form>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-2 border-b border-gray-300">Particulars</th>
            <th className="text-right p-2 border-b border-gray-300 w-36">Amount in Tk.</th>
            <th className="text-right p-2 border-b border-gray-300 w-36">Amount in Tk.</th>
          </tr>
        </thead>
        <tbody>
          {/* Section A */}
          <tr className="font-semibold">
            <td className="p-2 pt-3" colSpan={3}>A) Cash flows from Operating Activities</td>
          </tr>
          <tr>
            <td className="p-2 pl-6">Net Profit/(Loss) for the year</td>
            <td className="p-2 text-right">{fmt(data.operating.netProfit, true)}</td>
            <td></td>
          </tr>
          <tr>
            <td className="p-2 pl-6">Depreciation</td>
            <td className="p-2 text-right">{fmt(data.operating.depreciation, true)}</td>
            <td></td>
          </tr>
          <tr className="font-medium">
            <td className="p-2 pl-6">Changes in Working Capital</td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td className="p-2 pl-8">Increase/(Decrease) in Inventories</td>
            <td className="p-2 text-right">{fmt(data.operating.inventoryChange, true)}</td>
            <td></td>
          </tr>
          <tr className="font-semibold border-t border-gray-200">
            <td className="p-2">Net cash Provided/(used) by Operating Activities</td>
            <td></td>
            <td className="p-2 text-right">{fmt(data.operating.total, true)}</td>
          </tr>

          {/* Section B */}
          <tr className="font-semibold">
            <td className="p-2 pt-4" colSpan={3}>B) Cash flows from Investing Activities</td>
          </tr>
          <tr>
            <td className="p-2 pl-6">Acquisition of fixed Assets</td>
            <td className="p-2 text-right">{fmt(data.investing.assetPurchases, true)}</td>
            <td></td>
          </tr>
          <tr className="font-semibold border-t border-gray-200">
            <td className="p-2">Net cash Provided/(used) by Investing Activities</td>
            <td></td>
            <td className="p-2 text-right">{fmt(data.investing.total, true)}</td>
          </tr>

          {/* Section C */}
          <tr className="font-semibold">
            <td className="p-2 pt-4" colSpan={3}>C) Cash flows from Financing Activities</td>
          </tr>
          <tr>
            <td className="p-2 pl-6">Increase/(Decrease) in share Capital</td>
            <td className="p-2 text-right">{fmt(data.financing.shareCapitalChange, true)}</td>
            <td></td>
          </tr>
          <tr className="font-semibold border-t border-gray-200">
            <td className="p-2">Net cash Provided/(used) by Financing Activities</td>
            <td></td>
            <td className="p-2 text-right">{fmt(data.financing.total, true)}</td>
          </tr>

          <tr className="border-t-2 border-gray-400 font-bold">
            <td className="p-2">D) Net surplus/(deficit) in Cash and Cash Equivalents (A+B+C)</td>
            <td></td>
            <td className="p-2 text-right">{fmt(data.netChange, true)}</td>
          </tr>
          <tr>
            <td className="p-2">E) Cash and Cash Equivalents at beginning of the year</td>
            <td></td>
            <td className="p-2 text-right">{fmt(data.openingCash, true)}</td>
          </tr>
          <tr className="font-bold border-t border-gray-300">
            <td className="p-2">F) Cash and Cash Equivalents at end of the year (D+F)</td>
            <td></td>
            <td className="p-2 text-right">{fmt(data.closingCash, true)}</td>
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
