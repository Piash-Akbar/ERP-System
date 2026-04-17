import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineArrowDownTray, HiOutlineFunnel } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { useWarehouse } from '../../context/WarehouseContext';
import { getLedger, exportLedgerCSV } from '../../services/warehouseOps.service';

const typeColors = {
  receiving: 'green',
  issue: 'red',
  transfer_in: 'blue',
  transfer_out: 'purple',
  return: 'orange',
  adjustment: 'yellow',
  count_adjustment: 'gray',
};

const typeLabels = {
  receiving: 'RECEIVE',
  issue: 'ISSUE',
  transfer_in: 'TRANSFER',
  transfer_out: 'TRANSFER',
  return: 'RETURN',
  adjustment: 'ADJUST',
  count_adjustment: 'COUNT ADJ',
};

const WarehouseLedger = () => {
  const { selectedWarehouse } = useWarehouse();
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    movementType: '',
    product: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
  });

  useEffect(() => {
    if (selectedWarehouse?._id) loadData();
  }, [selectedWarehouse?._id, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { warehouse: selectedWarehouse._id, ...filters };
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
      const res = await getLedger(params);
      setData(res.data.data || []);
      setPagination(res.data.pagination || null);
      setSummary(res.data.summary || {});
    } catch {
      toast.error('Failed to load ledger');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = { warehouse: selectedWarehouse?._id, ...filters };
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
      const res = await exportLedgerCSV(params);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'warehouse-ledger.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed');
    }
  };

  if (!selectedWarehouse) {
    return (
      <div>
        <PageHeader title="Warehouse Ledger" subtitle="Complete stock movement history" />
        <p className="text-sm text-gray-400 py-10 text-center">Select a warehouse from the top bar.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Warehouse Ledger" subtitle="Complete stock movement history">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <HiOutlineArrowDownTray className="w-4 h-4" /> Export to CSV
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <HiOutlineFunnel className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Movement Type</label>
            <select
              value={filters.movementType}
              onChange={(e) => setFilters((f) => ({ ...f, movementType: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Types</option>
              <option value="receiving">Receiving</option>
              <option value="issue">Issue</option>
              <option value="transfer_in">Transfer In</option>
              <option value="transfer_out">Transfer Out</option>
              <option value="return">Return</option>
              <option value="adjustment">Adjustment</option>
              <option value="count_adjustment">Count Adjustment</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Product</label>
            <input
              type="text"
              placeholder="All Products"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              disabled
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 font-medium">Total Movements</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{summary.totalMovements || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 font-medium">Total Received</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{summary.totalReceived || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 font-medium">Total Issued</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{summary.totalIssued || 0}</p>
        </div>
      </div>

      {/* Movement Records */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Movement Records ({pagination?.total || data.length})
        </h3>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : data.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">No movement records found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100 dark:border-gray-700">
                  <th className="pb-2 font-medium">Date & Time</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium">Code</th>
                  <th className="pb-2 font-medium text-center">Quantity</th>
                  <th className="pb-2 font-medium">Source/Destination</th>
                  <th className="pb-2 font-medium">Reference</th>
                  <th className="pb-2 font-medium">Performed By</th>
                </tr>
              </thead>
              <tbody>
                {data.map((m) => (
                  <tr key={m._id} className="border-b border-gray-50 dark:border-gray-700">
                    <td className="py-3 text-gray-500 text-xs">
                      {new Date(m.date).toLocaleDateString()}<br />
                      <span className="text-gray-400">{new Date(m.date).toLocaleTimeString()}</span>
                    </td>
                    <td className="py-3">
                      <StatusBadge color={typeColors[m.movementType]}>
                        {typeLabels[m.movementType] || m.movementType}
                      </StatusBadge>
                    </td>
                    <td className="py-3 text-gray-800 dark:text-gray-200 font-medium">{m.product?.name}</td>
                    <td className="py-3 text-gray-500 text-xs font-mono">{m.product?.sku}</td>
                    <td className="py-3 text-center font-semibold">{m.quantity}</td>
                    <td className="py-3 text-gray-500 text-xs">
                      {m.sourceWarehouse?.name || m.destinationWarehouse?.name || '-'}
                    </td>
                    <td className="py-3 text-gray-500 text-xs font-mono">{m.reference || '-'}</td>
                    <td className="py-3 text-gray-500 text-xs">{m.performedBy?.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseLedger;
