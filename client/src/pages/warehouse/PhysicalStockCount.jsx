import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineQueueList, HiOutlinePlay, HiOutlineArrowPath } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import WarehouseScannerInput from '../../components/WarehouseScannerInput';
import { useWarehouse } from '../../context/WarehouseContext';
import {
  createCountSession,
  startCountSession,
  scanCountItem,
  completeCountSession,
  resetCountSession,
  getCountSessionById,
} from '../../services/warehouseOps.service';

const statusColors = {
  not_started: 'gray',
  in_progress: 'blue',
  completed: 'green',
  cancelled: 'red',
};

const PhysicalStockCount = () => {
  const { selectedWarehouse } = useWarehouse();
  const [sessionName, setSessionName] = useState('');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);

  const isActive = session?.status === 'in_progress';
  const isNotStarted = session?.status === 'not_started';

  const handleCreate = async () => {
    if (!selectedWarehouse?._id) return toast.error('Select a warehouse first');
    if (!sessionName.trim()) return toast.error('Enter a session name');

    setLoading(true);
    try {
      const res = await createCountSession({
        sessionName: sessionName.trim(),
        warehouse: selectedWarehouse._id,
      });
      setSession(res.data.data);
      toast.success('Count session created');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!session?._id) return;
    try {
      const res = await startCountSession(session._id);
      setSession(res.data.data);
      toast.success('Count session started');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start');
    }
  };

  const handleReset = async () => {
    if (!session?._id) return;
    try {
      const res = await resetCountSession(session._id);
      setSession(res.data.data);
      toast.success('Session reset');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset');
    }
  };

  const handleScan = async (product, barcode) => {
    if (!session?._id || !isActive) return;
    try {
      const res = await scanCountItem(session._id, { barcode, quantity: 1 });
      setSession(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Scan failed');
    }
  };

  const handleComplete = async () => {
    if (!session?._id) return;
    try {
      const res = await completeCountSession(session._id);
      setSession(res.data.data);
      toast.success('Session completed. Stock adjustments applied.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to complete');
    }
  };

  const refreshSession = async () => {
    if (!session?._id) return;
    try {
      const res = await getCountSessionById(session._id);
      setSession(res.data.data);
    } catch {}
  };

  return (
    <div>
      <PageHeader title="Physical Stock Count" subtitle="Scan products for physical inventory counting" />

      {/* Session Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Count Session Name</label>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g., Monthly Count - April 2026"
              disabled={!!session}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Session Status</label>
            <div className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
              <StatusBadge color={statusColors[session?.status || 'not_started']}>
                {(session?.status || 'Not Started').replace(/_/g, ' ')}
              </StatusBadge>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Items Counted</label>
            <div className="px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
              {session?.itemsCounted || 0}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          {!session && (
            <button
              onClick={handleCreate}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Create Session
            </button>
          )}
          {isNotStarted && (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              <HiOutlinePlay className="w-4 h-4" /> Start Count Session
            </button>
          )}
          {(isNotStarted || isActive) && session && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <HiOutlineArrowPath className="w-4 h-4" /> Reset Session
            </button>
          )}
          {isActive && (
            <button
              onClick={handleComplete}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700"
            >
              Complete Session
            </button>
          )}
        </div>
      </div>

      {/* Scanner */}
      <div className="mb-4">
        <WarehouseScannerInput
          onScan={handleScan}
          disabled={!isActive}
          placeholder={isActive ? 'Scan product barcode to count...' : 'Start a count session first'}
        />
      </div>

      {/* Count Results */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Count Results</h3>

        {!session || (session.items || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <HiOutlineQueueList className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm font-medium">No items counted yet</p>
            <p className="text-xs mt-1">Start a count session first</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100 dark:border-gray-700">
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium">SKU</th>
                  <th className="pb-2 font-medium text-center">System Qty</th>
                  <th className="pb-2 font-medium text-center">Counted Qty</th>
                  <th className="pb-2 font-medium text-center">Difference</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {session.items.map((item, i) => {
                  const diff = item.difference || 0;
                  return (
                    <tr key={i} className="border-b border-gray-50 dark:border-gray-700">
                      <td className="py-3 text-gray-800 dark:text-gray-200 font-medium">
                        {item.product?.name || 'Unknown'}
                      </td>
                      <td className="py-3 text-gray-500 text-xs">{item.product?.sku || item.barcode}</td>
                      <td className="py-3 text-center">{item.systemQuantity}</td>
                      <td className="py-3 text-center font-medium">{item.countedQuantity}</td>
                      <td className={`py-3 text-center font-medium ${
                        diff === 0 ? 'text-green-600' : diff > 0 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {diff > 0 ? `+${diff}` : diff}
                      </td>
                      <td className="py-3">
                        <StatusBadge color={item.status === 'counted' ? 'blue' : item.status === 'verified' ? 'green' : 'gray'}>
                          {item.status}
                        </StatusBadge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {session && session.items?.length > 0 && (
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
            <span>Total Products: <span className="font-medium">{session.totalProducts}</span></span>
            <span>Items Counted: <span className="font-medium">{session.itemsCounted}</span></span>
            <span>Total Variance: <span className="font-medium text-red-600">{session.totalVariance}</span></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhysicalStockCount;
