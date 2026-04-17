import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineArrowsRightLeft, HiOutlineCheck, HiOutlineXMark } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import WarehouseScannerInput from '../../components/WarehouseScannerInput';
import { useWarehouse } from '../../context/WarehouseContext';
import {
  createWarehouseTransfer,
  getPendingTransfers,
  getWarehouseTransfers,
  completeTransfer,
  cancelTransfer,
} from '../../services/warehouseOps.service';

const TABS = ['New Transfer', 'Pending Transfers', 'Transfer History'];

const statusColors = {
  pending: 'yellow',
  completed: 'green',
  cancelled: 'red',
};

const WarehouseTransfer = () => {
  const { warehouses, selectedWarehouse } = useWarehouse();
  const [activeTab, setActiveTab] = useState(0);

  // New Transfer state
  const [fromWarehouse, setFromWarehouse] = useState('');
  const [toWarehouse, setToWarehouse] = useState('');
  const [scannedProduct, setScannedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);

  // Lists
  const [pendingList, setPendingList] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    if (selectedWarehouse?._id) {
      setFromWarehouse(selectedWarehouse._id);
    }
  }, [selectedWarehouse]);

  useEffect(() => {
    if (activeTab === 1) loadPending();
    if (activeTab === 2) loadHistory();
  }, [activeTab]);

  const loadPending = async () => {
    setLoadingList(true);
    try {
      const res = await getPendingTransfers({ warehouse: selectedWarehouse?._id });
      setPendingList(res.data.data || []);
    } catch {}
    setLoadingList(false);
  };

  const loadHistory = async () => {
    setLoadingList(true);
    try {
      const res = await getWarehouseTransfers({ warehouse: selectedWarehouse?._id });
      setHistoryList(res.data.data || []);
    } catch {}
    setLoadingList(false);
  };

  const handleScan = (product) => {
    setScannedProduct(product);
    setQuantity(1);
  };

  const swapWarehouses = () => {
    setFromWarehouse(toWarehouse);
    setToWarehouse(fromWarehouse);
  };

  const handleCreateTransfer = async () => {
    if (!fromWarehouse || !toWarehouse) return toast.error('Select both warehouses');
    if (fromWarehouse === toWarehouse) return toast.error('Source and destination must be different');
    if (!scannedProduct) return toast.error('Scan a product first');
    if (quantity < 1) return toast.error('Quantity must be at least 1');

    setSaving(true);
    try {
      await createWarehouseTransfer({
        fromWarehouse,
        toWarehouse,
        product: scannedProduct._id,
        quantity,
        note: reference,
      });
      toast.success('Transfer created (pending)');
      setScannedProduct(null);
      setQuantity(1);
      setReference('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create transfer');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      await completeTransfer(id);
      toast.success('Transfer completed');
      loadPending();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to complete');
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancelTransfer(id);
      toast.success('Transfer cancelled');
      loadPending();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel');
    }
  };

  return (
    <div>
      <PageHeader title="Warehouse Transfer" subtitle="Transfer stock between warehouses" />

      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 mb-4 w-fit">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === i
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab: New Transfer */}
      {activeTab === 0 && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Source Warehouse</label>
                <select
                  value={fromWarehouse}
                  onChange={(e) => setFromWarehouse(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select...</option>
                  {warehouses.map((wh) => (
                    <option key={wh._id} value={wh._id}>{wh.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={swapWarehouses}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-purple-600"
                >
                  <HiOutlineArrowsRightLeft className="w-5 h-5" />
                </button>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Destination Warehouse</label>
                <select
                  value={toWarehouse}
                  onChange={(e) => setToWarehouse(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select...</option>
                  {warehouses.map((wh) => (
                    <option key={wh._id} value={wh._id}>{wh.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Transfer Reference</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g., TRN-2026-001"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Total Items to Transfer</label>
                <div className="px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                  {scannedProduct ? quantity : 0}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-1">
            <WarehouseScannerInput onScan={handleScan} />
          </div>
          <p className="text-xs text-gray-400 mb-4 ml-1">Tip: Continuous scan mode enabled. Scan multiple items quickly.</p>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Transfer List</h3>

            {!scannedProduct ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <HiOutlineArrowsRightLeft className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">No items scanned yet</p>
                <p className="text-xs mt-1">Start scanning products to add them to the transfer list</p>
              </div>
            ) : (
              <>
                <table className="w-full text-sm mb-4">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-gray-100 dark:border-gray-700">
                      <th className="pb-2 font-medium">Product</th>
                      <th className="pb-2 font-medium">SKU</th>
                      <th className="pb-2 font-medium text-center">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-50 dark:border-gray-700">
                      <td className="py-3 text-gray-800 dark:text-gray-200 font-medium">{scannedProduct.name}</td>
                      <td className="py-3 text-gray-500 text-xs">{scannedProduct.sku}</td>
                      <td className="py-3">
                        <input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-20 mx-auto block text-center px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="flex justify-end">
                  <button
                    onClick={handleCreateTransfer}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {saving ? 'Creating...' : 'Create Transfer'}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Tab: Pending Transfers */}
      {activeTab === 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          {loadingList ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : pendingList.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No pending transfers</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100 dark:border-gray-700">
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium">From</th>
                  <th className="pb-2 font-medium">To</th>
                  <th className="pb-2 font-medium text-center">Qty</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingList.map((t) => (
                  <tr key={t._id} className="border-b border-gray-50 dark:border-gray-700">
                    <td className="py-3 text-gray-800 dark:text-gray-200 font-medium">{t.product?.name}</td>
                    <td className="py-3 text-gray-500 text-xs">{t.fromWarehouse?.name}</td>
                    <td className="py-3 text-gray-500 text-xs">{t.toWarehouse?.name}</td>
                    <td className="py-3 text-center font-medium">{t.quantity}</td>
                    <td className="py-3">
                      <StatusBadge color={statusColors[t.status]}>{t.status}</StatusBadge>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleComplete(t._id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                          title="Complete"
                        >
                          <HiOutlineCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCancel(t._id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          title="Cancel"
                        >
                          <HiOutlineXMark className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Transfer History */}
      {activeTab === 2 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          {loadingList ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : historyList.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No transfer history</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100 dark:border-gray-700">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium">From</th>
                  <th className="pb-2 font-medium">To</th>
                  <th className="pb-2 font-medium text-center">Qty</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">By</th>
                </tr>
              </thead>
              <tbody>
                {historyList.map((t) => (
                  <tr key={t._id} className="border-b border-gray-50 dark:border-gray-700">
                    <td className="py-3 text-gray-500 text-xs">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 text-gray-800 dark:text-gray-200 font-medium">{t.product?.name}</td>
                    <td className="py-3 text-gray-500 text-xs">{t.fromWarehouse?.name}</td>
                    <td className="py-3 text-gray-500 text-xs">{t.toWarehouse?.name}</td>
                    <td className="py-3 text-center font-medium">{t.quantity}</td>
                    <td className="py-3">
                      <StatusBadge color={statusColors[t.status]}>{t.status}</StatusBadge>
                    </td>
                    <td className="py-3 text-gray-500 text-xs">{t.transferredBy?.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default WarehouseTransfer;
