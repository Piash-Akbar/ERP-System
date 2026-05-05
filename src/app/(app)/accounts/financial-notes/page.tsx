import { getSession } from '@/server/auth/session';
import { accountsService } from '@/server/services/accounts.service';

export default async function FinancialNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ asOf?: string; branchId?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();

  const asOf = sp.asOf ? new Date(sp.asOf) : new Date();
  const data = await accountsService.financialNotes(session, { branchId: sp.branchId, asOf });

  const asOfLabel = asOf.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  const fmt = (n: { toString(): string } | null | undefined) =>
    Number((n ?? 0).toString()).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold">Annex Leather Ltd.</h1>
        <p className="text-sm text-gray-500">Notes to the Financial Statements</p>
        <p className="text-sm text-gray-500">As at {asOfLabel}</p>
      </div>

      <form method="get" className="flex gap-3 mb-6 no-print">
        <label className="text-sm self-center">As of:</label>
        <input type="date" name="asOf" defaultValue={asOf.toISOString().slice(0, 10)} className="border rounded px-2 py-1 text-sm" />
        <button type="submit" className="px-3 py-1 bg-blue-600 text-white text-sm rounded">Apply</button>
        <button type="button" onClick={() => window.print()} className="px-3 py-1 bg-gray-100 border text-sm rounded ml-auto">Print</button>
      </form>

      {/* Note 4.00 — PP&E */}
      <section className="mb-8">
        <h2 className="font-semibold mb-2">4.00 Property, Plant and Equipment</h2>
        <table className="w-full text-sm border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Particulars</th>
              <th className="border border-gray-300 p-2 text-right w-32">Amount in Tk.</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-2">Gross Cost (Opening)</td>
              <td className="border border-gray-300 p-2 text-right">{fmt(data.ppe.openingCost)}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2">Closing Balance (Cost)</td>
              <td className="border border-gray-300 p-2 text-right">{fmt(data.ppe.closingCost)}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2 font-medium">Accumulated Depreciation</td>
              <td></td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2 pl-6">Balance</td>
              <td className="border border-gray-300 p-2 text-right">{fmt(data.ppe.openingAccumDep)}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2 pl-6">Closing Balance</td>
              <td className="border border-gray-300 p-2 text-right">{fmt(data.ppe.closingAccumDep)}</td>
            </tr>
            <tr className="font-bold bg-gray-50">
              <td className="border border-gray-300 p-2">Written down value as on {asOfLabel}</td>
              <td className="border border-gray-300 p-2 text-right">{fmt(data.ppe.writtenDownValue)}</td>
            </tr>
          </tbody>
        </table>

        {data.ppe.assets.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium mb-1">Asset breakdown:</p>
            <table className="w-full text-xs border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 p-1 text-left">Asset</th>
                  <th className="border border-gray-200 p-1 text-left">Category</th>
                  <th className="border border-gray-200 p-1 text-right">Cost</th>
                  <th className="border border-gray-200 p-1 text-right">Accum. Dep.</th>
                  <th className="border border-gray-200 p-1 text-right">WDV</th>
                </tr>
              </thead>
              <tbody>
                {data.ppe.assets.map((a, i) => (
                  <tr key={i}>
                    <td className="border border-gray-200 p-1">{a.name}</td>
                    <td className="border border-gray-200 p-1">{a.category}</td>
                    <td className="border border-gray-200 p-1 text-right">{fmt(a.cost)}</td>
                    <td className="border border-gray-200 p-1 text-right">{fmt(a.accumDep)}</td>
                    <td className="border border-gray-200 p-1 text-right">{fmt(a.wdv)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Note 5.00 — Inventories */}
      <section className="mb-8">
        <h2 className="font-semibold mb-2">5.00 Inventories</h2>
        <table className="w-full text-sm border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Particulars</th>
              <th className="border border-gray-300 p-2 text-right w-32">Amount in Tk.</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-2">Raw Materials</td>
              <td className="border border-gray-300 p-2 text-right">{fmt(data.inventories.rawMaterials)}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2">Work-in-process</td>
              <td className="border border-gray-300 p-2 text-right">{fmt(data.inventories.wip)}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2">Finished goods</td>
              <td className="border border-gray-300 p-2 text-right">{fmt(data.inventories.finishedGoods)}</td>
            </tr>
            <tr className="font-bold bg-gray-50">
              <td className="border border-gray-300 p-2">Total</td>
              <td className="border border-gray-300 p-2 text-right">{fmt(data.inventories.total)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Note 6.00 — Advances */}
      {data.advances.length > 0 && (
        <section className="mb-8">
          <h2 className="font-semibold mb-2">6.00 Advance, Deposits &amp; Pre-payments</h2>
          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Account</th>
                <th className="border border-gray-300 p-2 text-right w-32">Amount in Tk.</th>
              </tr>
            </thead>
            <tbody>
              {data.advances.map((a, i) => (
                <tr key={i}>
                  <td className="border border-gray-300 p-2">{a.name}</td>
                  <td className="border border-gray-300 p-2 text-right">{fmt(a.amount)}</td>
                </tr>
              ))}
              <tr className="font-bold bg-gray-50">
                <td className="border border-gray-300 p-2">Total</td>
                <td className="border border-gray-300 p-2 text-right">
                  {fmt(data.advances.reduce((s, a) => s + Number(a.amount.toString()), 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
