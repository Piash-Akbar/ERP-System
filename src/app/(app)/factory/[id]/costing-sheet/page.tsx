import { notFound } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { factoryService } from '@/server/services/factory.service';
import PrintButton from './print-button';

export default async function CostingSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  let data: Awaited<ReturnType<typeof factoryService.getCostingSheetData>>;
  try {
    data = await factoryService.getCostingSheetData(session, id);
  } catch {
    notFound();
  }

  const { header, costSummary, leatherTable, accessoriesTable } = data;
  const fmt = (n: { toString(): string } | null | undefined) =>
    n ? Number(n.toString()).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '—';

  const costLines: { label: string; amount: { toString(): string } }[] = [
    { label: 'Leather', amount: costSummary.leather },
    { label: 'Accessories', amount: costSummary.accessories },
    { label: 'Wages', amount: costSummary.wages },
    ...costSummary.otherEntries.map((e) => ({ label: e.description, amount: e.amount })),
  ];

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .print-page { box-shadow: none; border: none; margin: 0; padding: 12mm; max-width: none; }
        }
        .print-page { font-family: Arial, sans-serif; font-size: 11px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #555; padding: 3px 5px; vertical-align: top; }
        th { background: #d0d0d0; text-align: left; }
        .header-title { text-align: center; margin-bottom: 6px; }
        .header-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .section-label { background: #b0b0b0; font-weight: bold; }
      `}</style>

      <div className="no-print flex items-center gap-3 p-4 bg-white border-b">
        <a href={`/factory/${id}`} className="text-sm text-blue-600 hover:underline">
          ← Back to Order
        </a>
        <PrintButton />
      </div>

      <div className="print-page bg-white mx-auto max-w-5xl p-8 shadow-sm border">
        <div className="header-title">
          <div className="text-lg font-bold">{header.branchName}</div>
          <div className="text-sm font-semibold">Production Costing Sheet</div>
        </div>

        <div className="header-row text-sm">
          <span><strong>Serial No:</strong> {header.serialNo}</span>
          <span><strong>Date:</strong> {new Date(header.date).toLocaleDateString('en-GB')}</span>
        </div>
        <div className="header-row text-sm mb-4">
          <span><strong>Buyer Name:</strong> {header.buyerName || '—'}</span>
          <span><strong>Model/Batch Name:</strong> {header.batchName || '—'}</span>
        </div>

        <div className="two-col">
          {/* Left — Cost Summary */}
          <div>
            <table>
              <thead>
                <tr>
                  <th className="w-8">SL</th>
                  <th>Description</th>
                  <th className="text-right w-24">Amount</th>
                </tr>
              </thead>
              <tbody>
                {costLines.map((line, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{line.label}</td>
                    <td className="text-right">{fmt(line.amount)}</td>
                  </tr>
                ))}
                {/* filler rows */}
                {Array.from({ length: Math.max(0, 6 - costLines.length) }).map((_, i) => (
                  <tr key={`filler-${i}`}>
                    <td>{costLines.length + i + 1}</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3}>&nbsp;</td>
                </tr>
                <tr className="font-semibold">
                  <td>—</td>
                  <td>Total Cost</td>
                  <td className="text-right">{fmt(costSummary.totalCost)}</td>
                </tr>
                <tr>
                  <td>—</td>
                  <td>Quantity</td>
                  <td className="text-right">{fmt(costSummary.quantity)}</td>
                </tr>
                <tr>
                  <td>—</td>
                  <td>Per Unit Cost</td>
                  <td className="text-right">{fmt(costSummary.perUnitCost)}</td>
                </tr>
              </tbody>
            </table>

            {costSummary.profit !== null && (
              <div className="mt-3 font-bold text-sm border border-black p-2">
                Profit = {fmt(costSummary.saleAmount)} &minus; {fmt(costSummary.totalCost)} ={' '}
                <span className={costSummary.profit.gte(0) ? 'text-green-700' : 'text-red-600'}>
                  {fmt(costSummary.profit)}
                </span>
              </div>
            )}
          </div>

          {/* Right — Leather + Accessories */}
          <div className="space-y-4">
            {/* Leather Quantity */}
            <div>
              <table>
                <thead>
                  <tr>
                    <th className="w-6">S.N</th>
                    <th>Leather Quantity</th>
                    <th className="text-right w-16">Qty S/F</th>
                    <th className="text-right w-16">S/F Price</th>
                    <th className="text-right w-20">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {leatherTable.rows.map((row, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{row.description}</td>
                      <td className="text-right">{fmt(row.quantitySF)}</td>
                      <td className="text-right">{fmt(row.sfPrice)}</td>
                      <td className="text-right">{fmt(row.total)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold section-label">
                    <td colSpan={4}>Total Leather Purchase</td>
                    <td className="text-right">{fmt(leatherTable.grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Accessories List */}
            <div>
              <table>
                <thead>
                  <tr className="section-label">
                    <th className="w-6">S.N</th>
                    <th>Accessories List</th>
                    <th className="text-right w-16">Quantity</th>
                    <th className="text-right w-16">Price</th>
                    <th className="text-right w-20">Total Tk</th>
                  </tr>
                </thead>
                <tbody>
                  {accessoriesTable.rows.map((row, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{row.name}</td>
                      <td className="text-right">{fmt(row.quantity)}</td>
                      <td className="text-right">{fmt(row.price)}</td>
                      <td className="text-right">{fmt(row.total)}</td>
                    </tr>
                  ))}
                  {/* filler rows to 24 */}
                  {Array.from({ length: Math.max(0, 13 - accessoriesTable.rows.length) }).map((_, i) => (
                    <tr key={`acc-filler-${i}`}>
                      <td>{accessoriesTable.rows.length + i + 1}</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td colSpan={4}>Total Accessories</td>
                    <td className="text-right">{fmt(accessoriesTable.grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
