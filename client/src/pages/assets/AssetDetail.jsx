import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlinePencilSquare, HiOutlineWrench } from 'react-icons/hi2';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { getAsset, addAssetMaintenance, disposeAsset, runDepreciation } from '../../services/asset.service';

const statusColors = {
  active: 'green', in_maintenance: 'yellow', disposed: 'red', transferred: 'blue', inactive: 'gray',
};

const AssetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({ date: '', type: 'preventive', description: '', cost: '0', vendor: '' });
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  useEffect(() => { fetchAsset(); }, [id]);

  const fetchAsset = async () => {
    setLoading(true);
    try {
      const res = await getAsset(id);
      setAsset(res.data.data);
    } catch { toast.error('Failed to load asset'); }
    finally { setLoading(false); }
  };

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    if (!maintenanceForm.date || !maintenanceForm.description) {
      toast.error('Date and description are required');
      return;
    }
    setMaintenanceLoading(true);
    try {
      await addAssetMaintenance(id, { ...maintenanceForm, cost: Number(maintenanceForm.cost) || 0 });
      toast.success('Maintenance record added');
      setMaintenanceModalOpen(false);
      fetchAsset();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setMaintenanceLoading(false); }
  };

  const handleDispose = async () => {
    const method = window.prompt('Disposal method: sold, scrapped, donated, or written_off');
    if (!method || !['sold', 'scrapped', 'donated', 'written_off'].includes(method)) return;
    const reason = window.prompt('Reason for disposal:') || '';
    try {
      await disposeAsset(id, { method, reason, saleAmount: 0 });
      toast.success('Asset disposed');
      fetchAsset();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (!asset) return <div className="text-center py-20 text-gray-500">Asset not found</div>;

  const depPercent = asset.purchasePrice > 0 ? ((asset.accumulatedDepreciation / asset.purchasePrice) * 100).toFixed(1) : 0;

  return (
    <div>
      <button onClick={() => navigate('/assets')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <HiOutlineArrowLeft className="w-4 h-4" /> Back to Assets
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{asset.name}</h2>
            <p className="text-sm text-gray-500 font-mono">{asset.assetCode}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge color={statusColors[asset.status]}>{asset.status?.replace('_', ' ')}</StatusBadge>
            <button onClick={() => navigate(`/assets/${id}/edit`)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
              <HiOutlinePencilSquare className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">Category</span><p className="font-medium">{asset.category?.name || '-'}</p></div>
          <div><span className="text-gray-500">Purchase Price</span><p className="font-medium">{asset.purchasePrice?.toLocaleString()}</p></div>
          <div><span className="text-gray-500">Current Value</span><p className="font-medium text-green-600">{asset.currentValue?.toLocaleString()}</p></div>
          <div><span className="text-gray-500">Depreciation</span><p className="font-medium text-red-600">{asset.accumulatedDepreciation?.toLocaleString()} ({depPercent}%)</p></div>
          <div><span className="text-gray-500">Assigned To</span><p className="font-medium">{asset.assignedTo?.name || '-'}</p></div>
          <div><span className="text-gray-500">Location</span><p className="font-medium">{asset.location?.name || asset.branch?.name || '-'}</p></div>
          <div><span className="text-gray-500">Method</span><p className="font-medium capitalize">{asset.depreciationMethod?.replace('_', ' ')}</p></div>
          <div><span className="text-gray-500">Useful Life</span><p className="font-medium">{asset.usefulLife} months</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4">
        {['overview', 'depreciation', 'maintenance'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-lg capitalize ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3 text-sm">
          {asset.description && <div><span className="text-gray-500">Description</span><p>{asset.description}</p></div>}
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-gray-500">Serial Number</span><p>{asset.serialNumber || '-'}</p></div>
            <div><span className="text-gray-500">Barcode</span><p>{asset.barcode || '-'}</p></div>
            <div><span className="text-gray-500">Supplier</span><p>{asset.supplier?.name || '-'}</p></div>
            <div><span className="text-gray-500">Purchase Date</span><p>{asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '-'}</p></div>
          </div>
          {asset.status !== 'disposed' && (
            <div className="pt-4 flex gap-2">
              <button onClick={() => setMaintenanceModalOpen(true)} className="px-4 py-2 text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100">
                <HiOutlineWrench className="w-4 h-4 inline mr-1" /> Add Maintenance
              </button>
              <button onClick={handleDispose} className="px-4 py-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100">
                Dispose Asset
              </button>
            </div>
          )}
          {asset.disposal?.date && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-700">Disposal Info</h4>
              <p>Method: {asset.disposal.method} | Date: {new Date(asset.disposal.date).toLocaleDateString()} | Reason: {asset.disposal.reason || '-'}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'depreciation' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold mb-4">Depreciation Schedule</h3>
          {(!asset.depreciationSchedule || asset.depreciationSchedule.length === 0) ? (
            <p className="text-sm text-gray-500">No depreciation entries yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-4 py-2 text-left text-gray-600">Date</th>
                <th className="px-4 py-2 text-right text-gray-600">Amount</th>
                <th className="px-4 py-2 text-right text-gray-600">Book Value</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {asset.depreciationSchedule.map((entry, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-right text-red-600">{entry.amount?.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{entry.bookValue?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Maintenance History</h3>
            <button onClick={() => setMaintenanceModalOpen(true)} className="text-sm text-blue-600 hover:underline">+ Add Record</button>
          </div>
          {(!asset.maintenanceHistory || asset.maintenanceHistory.length === 0) ? (
            <p className="text-sm text-gray-500">No maintenance records</p>
          ) : (
            <div className="space-y-3">
              {asset.maintenanceHistory.map((m, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center justify-between">
                    <StatusBadge color={m.type === 'corrective' ? 'red' : m.type === 'preventive' ? 'green' : 'blue'}>{m.type}</StatusBadge>
                    <span className="text-gray-400">{new Date(m.date).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1">{m.description}</p>
                  {m.cost > 0 && <p className="text-gray-500">Cost: {m.cost.toLocaleString()}</p>}
                  {m.vendor && <p className="text-gray-500">Vendor: {m.vendor}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Maintenance Modal */}
      <Modal isOpen={maintenanceModalOpen} onClose={() => setMaintenanceModalOpen(false)} title="Add Maintenance Record">
        <form onSubmit={handleAddMaintenance} className="space-y-4">
          <FormInput label="Date" type="date" name="date" value={maintenanceForm.date} onChange={(e) => setMaintenanceForm((p) => ({ ...p, date: e.target.value }))} />
          <FormInput label="Type" type="select" name="type" value={maintenanceForm.type} onChange={(e) => setMaintenanceForm((p) => ({ ...p, type: e.target.value }))}>
            <option value="preventive">Preventive</option>
            <option value="corrective">Corrective</option>
            <option value="inspection">Inspection</option>
          </FormInput>
          <FormInput label="Description" name="description" value={maintenanceForm.description} onChange={(e) => setMaintenanceForm((p) => ({ ...p, description: e.target.value }))} placeholder="What was done" />
          <FormInput label="Cost" type="number" name="cost" value={maintenanceForm.cost} onChange={(e) => setMaintenanceForm((p) => ({ ...p, cost: e.target.value }))} min="0" />
          <FormInput label="Vendor" name="vendor" value={maintenanceForm.vendor} onChange={(e) => setMaintenanceForm((p) => ({ ...p, vendor: e.target.value }))} placeholder="Optional" />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setMaintenanceModalOpen(false)} className="px-4 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg">Cancel</button>
            <button type="submit" disabled={maintenanceLoading} className="px-4 py-2.5 text-sm text-white bg-blue-600 rounded-lg disabled:opacity-50">
              {maintenanceLoading ? 'Saving...' : 'Add Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AssetDetail;
