import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineQrCode, HiOutlinePlus } from 'react-icons/hi2';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import { getUnassigned, generateBarcode, generateBulk } from '../../services/barcode.service';

const BarcodeGenerator = () => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [barcodeType, setBarcodeType] = useState('CODE128');
  const [prefix, setPrefix] = useState('ANX');
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState([]);

  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getUnassigned);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (!data) return;
    const allIds = data.map((p) => p._id);
    setSelectedIds((prev) => (prev.length === allIds.length ? [] : allIds));
  };

  const handleGenerateSingle = async (productId) => {
    setGenerating(true);
    try {
      const res = await generateBarcode({ productId, barcodeType, prefix });
      toast.success(`Barcode generated: ${res.data.data.barcode}`);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateBulk = async () => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one product');
      return;
    }
    setGenerating(true);
    try {
      const res = await generateBulk({ productIds: selectedIds, barcodeType, prefix });
      const results = res.data.data || [];
      setResults(results);
      const successCount = results.filter((r) => r.success).length;
      toast.success(`Generated ${successCount} barcode(s)`);
      setSelectedIds([]);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  };

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={data?.length > 0 && selectedIds.length === data?.length}
          onChange={selectAll}
          className="w-4 h-4"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row._id)}
          onChange={() => toggleSelect(row._id)}
          className="w-4 h-4"
        />
      ),
    },
    { key: 'name', label: 'Product Name' },
    { key: 'sku', label: 'SKU', render: (row) => <span className="font-mono text-sm">{row.sku}</span> },
    { key: 'category', label: 'Category', render: (row) => row.category?.name || '-' },
    {
      key: 'sellingPrice',
      label: 'Price',
      render: (row) => row.sellingPrice?.toLocaleString(),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <button
          onClick={() => handleGenerateSingle(row._id)}
          disabled={generating}
          className="text-sm text-blue-600 hover:underline disabled:opacity-50"
        >
          Generate
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Generate Barcodes" subtitle="Products without barcodes">
        <div className="flex items-center gap-3">
          <select
            value={barcodeType}
            onChange={(e) => setBarcodeType(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
          >
            <option value="CODE128">CODE128</option>
            <option value="EAN13">EAN-13</option>
            <option value="EAN8">EAN-8</option>
            <option value="UPC">UPC</option>
            <option value="QR">QR Code</option>
          </select>
          <input
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg"
            placeholder="Prefix"
            maxLength={10}
          />
          <button
            onClick={handleGenerateBulk}
            disabled={generating || selectedIds.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <HiOutlineQrCode className="w-4 h-4" />
            Generate Selected ({selectedIds.length})
          </button>
        </div>
      </PageHeader>

      {results.length > 0 && (
        <div className="mb-4 p-4 bg-green-50 rounded-xl border border-green-200">
          <h3 className="text-sm font-semibold text-green-800 mb-2">Generation Results</h3>
          <div className="space-y-1 text-sm">
            {results.map((r, i) => (
              <div key={i} className={r.success ? 'text-green-700' : 'text-red-600'}>
                {r.success ? `Barcode: ${r.barcode}` : `Failed: ${r.error}`}
              </div>
            ))}
          </div>
          <button onClick={() => setResults([])} className="text-xs text-gray-500 mt-2 hover:underline">Dismiss</button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data || []}
        pagination={pagination}
        onPageChange={setPage}
        onSearch={setSearch}
        loading={loading}
      />
    </div>
  );
};

export default BarcodeGenerator;
