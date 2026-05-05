import { notFound } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { corporateService } from '@/server/services/corporate-sales.service';
import PrintButton from './print-button';

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  let inv: Awaited<ReturnType<typeof corporateService.getInvoice>>;
  try {
    inv = await corporateService.getInvoice(session, id);
  } catch {
    notFound();
  }

  const fmt = (n: { toString(): string } | null | undefined) =>
    n ? Number(n.toString()).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';

  const advance = inv.payments.reduce(
    (s, p) => s + Number(p.amount.toString()),
    0,
  );

  const totalNum = Number(inv.grandTotal.toString());
  const due = Number(inv.balanceDue.toString());

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .invoice-page { box-shadow: none; border: none; margin: 0; padding: 12mm; max-width: none; }
        }
        .invoice-page { font-family: Arial, sans-serif; font-size: 11px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #333; padding: 4px 6px; }
        th { background: #333; color: white; text-align: center; }
        .header-block td { border: 1px solid #333; padding: 3px 6px; }
      `}</style>

      <div className="no-print flex items-center gap-3 p-4 bg-white border-b">
        <a href={`/corporate-sales/invoices/${id}`} className="text-sm text-blue-600 hover:underline">
          ← Back to Invoice
        </a>
        <PrintButton />
      </div>

      <div className="invoice-page bg-white mx-auto max-w-3xl p-10 shadow-sm border mt-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-xl font-bold">{inv.branch.name}</div>
            {inv.branch.address && <div className="text-xs">{inv.branch.address}</div>}
            {inv.branch.phone && <div className="text-xs">Phone: {inv.branch.phone}</div>}
          </div>
          <div className="text-right">
            {/* Logo placeholder */}
            <div className="w-16 h-16 border border-gray-300 flex items-center justify-center text-gray-400 text-xs">
              LOGO
            </div>
          </div>
        </div>

        <div className="text-center font-bold text-base border border-black py-1 mb-3">
          Bill/Invoice
        </div>

        {/* Invoice meta + Customer */}
        <table className="header-block mb-4">
          <tbody>
            <tr>
              <td className="w-1/2 font-semibold">{inv.branch.name}</td>
              <td className="w-24 font-semibold">Date</td>
              <td>:</td>
              <td>{new Date(inv.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
            </tr>
            <tr>
              <td>{inv.branch.address ?? ''}</td>
              <td className="font-semibold">Order No</td>
              <td>:</td>
              <td>{inv.order.number}</td>
            </tr>
            {inv.branch.phone && (
              <tr>
                <td>Phone: {inv.branch.phone}</td>
                <td colSpan={3}></td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex gap-4 mb-4">
          <div className="flex-1 border border-black p-2">
            <div className="font-bold text-xs mb-1">To</div>
            <div className="font-semibold">{inv.customer.name}</div>
            {inv.customer.address && <div className="text-xs">{inv.customer.address}</div>}
            {inv.customer.city && <div className="text-xs">{inv.customer.city}</div>}
          </div>
          <div className="flex-1 border border-black p-2">
            <div className="font-bold text-xs mb-1">SHIPPING DETAILS</div>
            <div className="text-xs">{inv.customer.name}</div>
            {inv.customer.address && <div className="text-xs">{inv.customer.address}</div>}
          </div>
        </div>

        {/* Items table */}
        <table className="mb-4">
          <thead>
            <tr>
              <th className="w-10">SLNO</th>
              <th>DESCRIPTION</th>
              <th className="w-28">COLOR &amp; DESIGN</th>
              <th className="w-14">QTY</th>
              <th className="w-24">ANNEX PRICE</th>
              <th className="w-24">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((item, i) => (
              <tr key={item.id}>
                <td className="text-center">{i + 1}</td>
                <td>{item.description || item.product.name}</td>
                <td className="text-center">{item.colorDesign ?? ''}</td>
                <td className="text-center">{Number(item.quantity.toString())}</td>
                <td className="text-right">{fmt(item.unitPrice)}</td>
                <td className="text-right">{fmt(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer summary */}
        <div className="flex">
          <div className="flex-1 border border-black p-2 text-xs flex items-center">
            <span>In word: </span>
            {/* Approximate word representation */}
            <span className="ml-1 font-semibold">
              {totalNum.toLocaleString('en-BD')} taka only
            </span>
          </div>
          <div className="w-48">
            <table>
              <tbody>
                <tr>
                  <td className="font-semibold">Total</td>
                  <td className="text-right font-semibold">{fmt(inv.grandTotal)}</td>
                </tr>
                <tr>
                  <td className="font-semibold">Advance</td>
                  <td className="text-right">{advance.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td className="font-semibold">Due</td>
                  <td className="text-right">{due.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Signature block */}
        <div className="flex justify-between mt-12">
          <div className="text-center">
            <div className="border-t border-black w-32 mx-auto pt-1">Received By</div>
          </div>
          <div className="text-center">
            <div className="w-24 h-16 border border-gray-300 mx-auto mb-1 flex items-center justify-center text-xs text-gray-400">
              Stamp
            </div>
            <div className="border-t border-black w-32 mx-auto pt-1">Authorised Signature</div>
          </div>
        </div>
      </div>
    </>
  );
}
