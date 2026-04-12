import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import useFetch from '../../hooks/useFetch';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { getPlans, createPlan, updatePlan, deletePlan, getManufacturingSummary } from '../../services/manufacturing.service';
import { getProducts } from '../../services/product.service';

const planStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
const statusBg = { scheduled: 'bg-yellow-50 text-yellow-700', in_progress: 'bg-blue-50 text-blue-700', completed: 'bg-green-50 text-green-700', cancelled: 'bg-red-50 text-red-700' };
const materialStatusColors = { available: 'green', partial: 'yellow', shortage: 'red' };

const ProductionPlanning = () => {
  const [summary, setSummary] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ product: '', quantity: '', startDate: '', endDate: '', resources: '', materialStatus: 'available', notes: '' });
  const [progressModal, setProgressModal] = useState({ open: false, plan: null });
  const [progressForm, setProgressForm] = useState({ progress: 0, status: 'scheduled', materialStatus: 'available', notes: '' });
  const [savingProgress, setSavingProgress] = useState(false);
  const [viewModal, setViewModal] = useState({ open: false, plan: null });

  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getPlans);

  useEffect(() => {
    getManufacturingSummary().then((res) => setSummary(res.data.data)).catch(() => toast.error('Failed to load summary'));
    getProducts({ limit: 200 }).then((res) => setProducts(res.data.data?.data || res.data.data || [])).catch(() => toast.error('Failed to load products'));
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await updatePlan(id, { status });
      toast.success('Status updated');
      refetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const openProgress = (plan) => {
    setProgressForm({
      progress: plan.progress || 0,
      status: plan.status || 'scheduled',
      materialStatus: plan.materialStatus || 'available',
      notes: plan.notes || '',
    });
    setProgressModal({ open: true, plan });
  };

  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    setSavingProgress(true);
    try {
      const payload = {
        progress: Number(progressForm.progress),
        status: progressForm.status,
        materialStatus: progressForm.materialStatus,
        notes: progressForm.notes,
      };
      if (payload.progress >= 100) payload.status = 'completed';
      await updatePlan(progressModal.plan._id, payload);
      toast.success('Progress updated');
      setProgressModal({ open: false, plan: null });
      refetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSavingProgress(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    try { await deletePlan(id); toast.success('Deleted'); refetch(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product || !form.quantity || !form.startDate || !form.endDate) return toast.error('Fill required fields');
    setSaving(true);
    try {
      await createPlan({ ...form, quantity: Number(form.quantity) });
      toast.success('Plan created'); setModalOpen(false);
      setForm({ product: '', quantity: '', startDate: '', endDate: '', resources: '', materialStatus: 'available', notes: '' });
      refetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const plans = data || [];

  return (
    <div>
      <PageHeader title="Production Planning" subtitle="Manage production planning and resource allocation">
        <button onClick={() => setModalOpen(true)} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">+ Create Plan</button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Total Plans</p><p className="text-2xl font-bold text-blue-600 mt-1">{summary?.totalPlans || plans.length}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">In Progress</p><p className="text-2xl font-bold text-orange-600 mt-1">{summary?.inProgressPlans || 0}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Completed</p><p className="text-2xl font-bold text-green-600 mt-1">{summary?.completedPlans || 0}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Work Orders</p><p className="text-2xl font-bold text-purple-600 mt-1">{summary?.totalWorkOrders || 0}</p></div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <input type="text" placeholder="Search plans..." onChange={(e) => setSearch(e.target.value)} className="pl-3 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-64" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">PLAN CODE</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">PRODUCT</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">QTY</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">START</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">END</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">MATERIAL</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">PROGRESS</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">STATUS</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ACTIONS</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={9} className="text-center py-12 text-gray-400">Loading...</td></tr>
              : plans.length === 0 ? <tr><td colSpan={9} className="text-center py-12 text-gray-400">No plans found</td></tr>
              : plans.map((p) => (
                <tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.planCode}</td>
                  <td className="px-4 py-3 text-gray-700">{p.product?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{p.quantity}</td>
                  <td className="px-4 py-3 text-gray-700">{new Date(p.startDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-700">{new Date(p.endDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><StatusBadge color={materialStatusColors[p.materialStatus]}>{p.materialStatus}</StatusBadge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5"><div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${p.progress || 0}%` }}></div></div>
                      <span className="text-xs text-gray-500">{p.progress || 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select value={p.status} onChange={(e) => handleStatusChange(p._id, e.target.value)}
                      className={`px-2 py-1 text-xs font-medium rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-orange-400 ${statusBg[p.status] || 'bg-gray-50 text-gray-700'}`}>
                      {planStatuses.map((s) => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setViewModal({ open: true, plan: p })} className="text-gray-700 hover:text-gray-900 text-xs font-medium">View</button>
                      <button onClick={() => openProgress(p)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Update</button>
                      <button onClick={() => handleDelete(p._id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Production Plan" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Product *" type="select" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })}>
              <option value="">Select product</option>
              {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
            </FormInput>
            <FormInput label="Quantity *" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} min="1" />
            <FormInput label="Start Date *" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <FormInput label="End Date *" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <FormInput label="Resources" value={form.resources} onChange={(e) => setForm({ ...form, resources: e.target.value })} placeholder="e.g. 10 machines, 50 workers" />
          <FormInput label="Notes" type="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">{saving ? 'Creating...' : 'Create Plan'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={progressModal.open} onClose={() => setProgressModal({ open: false, plan: null })} title={`Update Progress — ${progressModal.plan?.planCode || ''}`} size="md">
        <form onSubmit={handleProgressSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Progress ({progressForm.progress}%)</label>
            <input type="range" min="0" max="100" step="1" value={progressForm.progress}
              onChange={(e) => setProgressForm({ ...progressForm, progress: e.target.value })}
              className="w-full accent-orange-500" />
            <div className="flex items-center gap-2 mt-2">
              <input type="number" min="0" max="100" value={progressForm.progress}
                onChange={(e) => setProgressForm({ ...progressForm, progress: e.target.value })}
                className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${progressForm.progress}%` }}></div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Status" type="select" value={progressForm.status} onChange={(e) => setProgressForm({ ...progressForm, status: e.target.value })}>
              {planStatuses.map((s) => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
            </FormInput>
            <FormInput label="Material Status" type="select" value={progressForm.materialStatus} onChange={(e) => setProgressForm({ ...progressForm, materialStatus: e.target.value })}>
              <option value="available">Available</option>
              <option value="partial">Partial</option>
              <option value="shortage">Shortage</option>
            </FormInput>
          </div>
          <FormInput label="Notes" type="textarea" value={progressForm.notes} onChange={(e) => setProgressForm({ ...progressForm, notes: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setProgressModal({ open: false, plan: null })} className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={savingProgress} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">{savingProgress ? 'Saving...' : 'Save Progress'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={viewModal.open} onClose={() => setViewModal({ open: false, plan: null })} title={`Plan Details — ${viewModal.plan?.planCode || ''}`} size="lg">
        {viewModal.plan && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-gray-500">Plan Code</p><p className="font-medium text-gray-900">{viewModal.plan.planCode}</p></div>
              <div><p className="text-xs text-gray-500">Product</p><p className="font-medium text-gray-900">{viewModal.plan.product?.name || '-'} {viewModal.plan.product?.sku && <span className="text-gray-500">({viewModal.plan.product.sku})</span>}</p></div>
              <div><p className="text-xs text-gray-500">Quantity</p><p className="font-medium text-gray-900">{viewModal.plan.quantity}</p></div>
              <div><p className="text-xs text-gray-500">Status</p><span className={`inline-block px-2 py-1 text-xs font-medium rounded-lg ${statusBg[viewModal.plan.status] || 'bg-gray-50 text-gray-700'}`}>{viewModal.plan.status?.replace('_', ' ')}</span></div>
              <div><p className="text-xs text-gray-500">Start Date</p><p className="font-medium text-gray-900">{new Date(viewModal.plan.startDate).toLocaleDateString()}</p></div>
              <div><p className="text-xs text-gray-500">End Date</p><p className="font-medium text-gray-900">{new Date(viewModal.plan.endDate).toLocaleDateString()}</p></div>
              <div><p className="text-xs text-gray-500">Material Status</p><StatusBadge color={materialStatusColors[viewModal.plan.materialStatus]}>{viewModal.plan.materialStatus}</StatusBadge></div>
              <div><p className="text-xs text-gray-500">Created By</p><p className="font-medium text-gray-900">{viewModal.plan.createdBy?.name || '-'}</p></div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Progress</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 rounded-full h-2"><div className="bg-orange-500 h-2 rounded-full" style={{ width: `${viewModal.plan.progress || 0}%` }}></div></div>
                <span className="text-sm font-medium text-gray-700">{viewModal.plan.progress || 0}%</span>
              </div>
            </div>
            {viewModal.plan.resources && <div><p className="text-xs text-gray-500 mb-1">Resources</p><p className="text-sm text-gray-800 whitespace-pre-wrap">{viewModal.plan.resources}</p></div>}
            {viewModal.plan.notes && <div><p className="text-xs text-gray-500 mb-1">Notes</p><p className="text-sm text-gray-800 whitespace-pre-wrap">{viewModal.plan.notes}</p></div>}
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 pt-3 border-t border-gray-200">
              <div>Created: {viewModal.plan.createdAt ? new Date(viewModal.plan.createdAt).toLocaleString() : '-'}</div>
              <div>Updated: {viewModal.plan.updatedAt ? new Date(viewModal.plan.updatedAt).toLocaleString() : '-'}</div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={() => setViewModal({ open: false, plan: null })} className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Close</button>
              <button type="button" onClick={() => { const plan = viewModal.plan; setViewModal({ open: false, plan: null }); openProgress(plan); }} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">Update Progress</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductionPlanning;
