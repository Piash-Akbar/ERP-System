import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { useWarehouse } from '../../context/WarehouseContext';
import { getReconciliation, applyReconciliation } from '../../services/warehouseOps.service';

const StockReconciliation = () => {
  const { selectedWarehouse } = useWarehouse();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedWarehouse?._id) loadData();
  }, [selectedWarehouse?._id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getReconciliation({ warehouse: selectedWarehouse._id, includeZero: false });
      const data = res.data.data;
      setItems(
        (data.items || []).map((item) => ({
          ...item,
          physicalQty: item.systemQty,
          reason: '',
        }))
      );
    } catch (err) {
      toast.error('Failed to load reconciliation data');
    } finally {
      setLoading(false);
    }
  };

  const updatePhysicalQty = (index, value) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const qty = Math.max(0, parseInt(value) || 0);
        return { ...item, physicalQty: qty };
      })
    );
  };

  const updateReason = (index, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, reason: value } : item)));
  };

  const resetAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, physicalQty: item.systemQty, reason: '' })));
  };

  const itemsWithDifference = items.filter((i) => i.physicalQty !== i.systemQty);
  const totalVariance = itemsWithDifference.reduce(
    (sum, i) => sum + Math.abs(i.physicalQty - i.systemQty),
    0
  );

  const handleApply = async () => {
    if (itemsWithDifference.length === 0) return toast.error('No differences to adjust');
    if (!selectedWarehouse?._id) return toast.error('Select a warehouse first');

    setSaving(true);
    try {
      await applyReconciliation({
        warehouse: selectedWarehouse._id,
        items: itemsWithDifference.map((i) => ({
          product: i.product,
          systemQty: i.systemQty,
          physicalQty: i.physicalQty,
          reason: i.reason,
        })),
      });
      toast.success('Reconciliation adjustments applied');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to apply adjustments');
    } finally {
      setSaving(false);
    }
  };

  if (!selectedWarehouse) {
    return (
      <div>
        <PageHeader title="Stock Reconciliation" subtitle="Compare system stock vs physical stock and make adjustments" />
        <p className="text-sm text-gray-400 py-10 text-center">Select a warehouse from the top bar.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Stock Reconciliation" subtitle="Compare system stock vs physical stock and make adjustments" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 font-medium">Total Products</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{items.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 font-medium">Items with Difference</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{itemsWithDifference.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 font-medium">Total Variance</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{totalVariance}</p>
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Reconciliation Details</h3>
          <button
            onClick={resetAll}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Reset All
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">No products found in this warehouse</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100 dark:border-gray-700">
                    <th className="pb-2 font-medium">Product</th>
                    <th className="pb-2 font-medium">Code</th>
                    <th className="pb-2 font-medium text-center">System Qty</th>
                    <th className="pb-2 font-medium text-center">Physical Qty</th>
                    <th className="pb-2 font-medium text-center">Difference</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Adjustment Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const diff = item.physicalQty - item.systemQty;
                    const isMatched = diff === 0;
                    return (
                      <tr key={i} className="border-b border-gray-50 dark:border-gray-700">
                        <td className="py-3 text-gray-800 dark:text-gray-200 font-medium">{item.name}</td>
                        <td className="py-3 text-gray-500 text-xs font-mono">{item.sku}</td>
                        <td className="py-3 text-center">{item.systemQty}</td>
                        <td className="py-3">
                          <input
                            type="number"
                            min="0"
                            value={item.physicalQty}
                            onChange={(e) => updatePhysicalQty(i, e.target.value)}
                            className={`w-20 mx-auto block text-center px-2 py-1 border rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                              !isMatched ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10' : 'border-gray-300 dark:border-gray-600'
                            }`}
                          />
                        </td>
                        <td className={`py-3 text-center font-medium ${
                          isMatched ? 'text-green-600' : diff > 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {isMatched ? 0 : diff > 0 ? `+${diff}` : diff}
                        </td>
                        <td className="py-3">
                          {isMatched ? (
                            <span className="flex items-center gap-1 text-xs text-green-600">
                              <HiOutlineCheckCircle className="w-4 h-4" /> Matched
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-yellow-600">
                              <HiOutlineXCircle className="w-4 h-4" /> Mismatch
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          {!isMatched && (
                            <input
                              type="text"
                              value={item.reason}
                              onChange={(e) => updateReason(i, e.target.value)}
                              placeholder="Enter reason..."
                              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {itemsWithDifference.length > 0 && (
              <div className="flex justify-end mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={handleApply}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  {saving ? 'Applying...' : `Apply ${itemsWithDifference.length} Adjustments`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StockReconciliation;
