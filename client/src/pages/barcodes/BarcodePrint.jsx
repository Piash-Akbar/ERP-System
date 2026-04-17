import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePrinter } from 'react-icons/hi2';
import useFetch from '../../hooks/useFetch';
import PageHeader from '../../components/PageHeader';
import { getBarcodeLogs, getPrintData, logPrint } from '../../services/barcode.service';

const BarcodePrint = () => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [printItems, setPrintItems] = useState([]);
  const [labelsPerRow, setLabelsPerRow] = useState(3);
  const printRef = useRef();

  const { data, pagination, loading, setPage, setSearch } = useFetch(getBarcodeLogs);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handlePreview = async () => {
    const productIds = (data || [])
      .filter((log) => selectedIds.includes(log._id))
      .map((log) => log.product?._id)
      .filter(Boolean);

    if (productIds.length === 0) {
      toast.error('Select at least one barcode');
      return;
    }

    try {
      const res = await getPrintData([...new Set(productIds)]);
      setPrintItems(res.data.data || []);
    } catch {
      toast.error('Failed to load print data');
    }
  };

  const handlePrint = async () => {
    const barcodes = printItems.map((p) => p.barcode).filter(Boolean);
    if (barcodes.length > 0) {
      try { await logPrint(barcodes); } catch {}
    }

    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
      <head>
        <title>Barcode Labels</title>
        <style>
          body { font-family: monospace; margin: 0; padding: 20px; }
          .grid { display: grid; grid-template-columns: repeat(${labelsPerRow}, 1fr); gap: 10px; }
          .label { border: 1px solid #ccc; padding: 12px; text-align: center; page-break-inside: avoid; }
          .label .name { font-size: 12px; font-weight: bold; margin-bottom: 4px; }
          .label .barcode { font-size: 18px; letter-spacing: 3px; font-family: 'Libre Barcode 128', monospace; margin: 8px 0; }
          .label .code { font-size: 10px; color: #666; }
          .label .price { font-size: 11px; margin-top: 4px; }
          @media print { body { padding: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="grid">
          ${printItems.map((item) => `
            <div class="label">
              <div class="name">${item.name}</div>
              <div class="barcode">${item.barcode || ''}</div>
              <div class="code">${item.barcode || 'N/A'}</div>
              <div class="code">${item.sku}</div>
              <div class="price">Price: ${item.price?.toLocaleString() || '-'}</div>
            </div>
          `).join('')}
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div>
      <PageHeader title="Print Barcode Labels" subtitle="Select barcodes and print labels">
        <div className="flex items-center gap-3">
          <select
            value={labelsPerRow}
            onChange={(e) => setLabelsPerRow(Number(e.target.value))}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
          >
            <option value={2}>2 per row</option>
            <option value={3}>3 per row</option>
            <option value={4}>4 per row</option>
          </select>
          <button
            onClick={handlePreview}
            disabled={selectedIds.length === 0}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Preview ({selectedIds.length})
          </button>
          {printItems.length > 0 && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              <HiOutlinePrinter className="w-4 h-4" />
              Print
            </button>
          )}
        </div>
      </PageHeader>

      {/* Print Preview */}
      {printItems.length > 0 && (
        <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200" ref={printRef}>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Print Preview</h3>
          <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${labelsPerRow}, 1fr)` }}>
            {printItems.map((item, i) => (
              <div key={i} className="border border-gray-300 rounded-lg p-3 text-center">
                <p className="text-xs font-bold">{item.name}</p>
                <p className="font-mono text-lg my-2 tracking-widest">{item.barcode || 'N/A'}</p>
                <p className="text-xs text-gray-500">{item.sku}</p>
                <p className="text-xs text-gray-600 mt-1">Price: {item.price?.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barcode Selection Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={data?.length > 0 && selectedIds.length === data?.length}
                  onChange={() => {
                    if (!data) return;
                    setSelectedIds((prev) => prev.length === data.length ? [] : data.map((d) => d._id));
                  }}
                  className="w-4 h-4"
                />
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Barcode</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Product</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Printed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : (data || []).length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No barcodes found</td></tr>
            ) : (
              (data || []).map((row) => (
                <tr key={row._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.includes(row._id)} onChange={() => toggleSelect(row._id)} className="w-4 h-4" />
                  </td>
                  <td className="px-4 py-3 font-mono">{row.barcode}</td>
                  <td className="px-4 py-3">{row.product?.name || '-'}</td>
                  <td className="px-4 py-3">{row.barcodeType}</td>
                  <td className="px-4 py-3">{row.printCount || 0}x</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BarcodePrint;
